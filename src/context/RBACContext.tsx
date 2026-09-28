import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { auditService } from '../services/auditService';

export type OrgRole = 'admin' | 'manager' | 'user';

export type Permission =
  | 'VIEW_DASHBOARD'
  | 'VIEW_ASSETS'
  | 'VIEW_SOURCE_RECORDS'
  | 'VIEW_EVIDENCE'
  | 'VIEW_FINDINGS'
  | 'VIEW_INVESTIGATIONS'
  | 'ASK_AI'
  | 'EXPORT_DATA'
  | 'CREATE_INVESTIGATION'
  | 'EDIT_INVESTIGATION'
  | 'MANAGE_CORRELATION'
  | 'CREATE_EXCEPTION'
  | 'ARCHIVE_ASSET'
  | 'REACTIVATE_ASSET'
  | 'SYNC_DATA'
  | 'VIEW_AUDIT'
  | 'MANAGE_MEMBERS'
  | 'MANAGE_ROLES'
  | 'REMOVE_MEMBERS'
  | 'MANAGE_ORGANIZATION';

interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
  users?: {
    email: string;
    display_name?: string;
  };
}

interface RBACContextType {
  role: OrgRole;
  isAdmin: boolean;
  isManager: boolean;
  isUser: boolean;
  can: (permission: Permission) => boolean;
  members: OrganizationMember[];
  isLoadingMembers: boolean;
  updateMemberRole: (targetUserId: string, newRole: OrgRole) => Promise<boolean>;
  removeMember: (targetUserId: string) => Promise<boolean>;
  refreshMembers: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);
const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  user: 1,
  manager: 2,
  admin: 3,
};

const PERMISSIONS_MAP: Record<OrgRole, Permission[]> = {
  user: [
    'VIEW_DASHBOARD',
    'VIEW_ASSETS',
    'VIEW_SOURCE_RECORDS',
    'VIEW_EVIDENCE',
    'VIEW_FINDINGS',
    'VIEW_INVESTIGATIONS',
    'ASK_AI',
    'EXPORT_DATA',
  ],
  manager: [
    'VIEW_DASHBOARD',
    'VIEW_ASSETS',
    'VIEW_SOURCE_RECORDS',
    'VIEW_EVIDENCE',
    'VIEW_FINDINGS',
    'VIEW_INVESTIGATIONS',
    'ASK_AI',
    'EXPORT_DATA',
    'CREATE_INVESTIGATION',
    'EDIT_INVESTIGATION',
    'MANAGE_CORRELATION',
    'CREATE_EXCEPTION',
    'ARCHIVE_ASSET',
    'REACTIVATE_ASSET',
    'SYNC_DATA',
    'VIEW_AUDIT',
  ],
  admin: [
    'VIEW_DASHBOARD',
    'VIEW_ASSETS',
    'VIEW_SOURCE_RECORDS',
    'VIEW_EVIDENCE',
    'VIEW_FINDINGS',
    'VIEW_INVESTIGATIONS',
    'ASK_AI',
    'EXPORT_DATA',
    'CREATE_INVESTIGATION',
    'EDIT_INVESTIGATION',
    'MANAGE_CORRELATION',
    'CREATE_EXCEPTION',
    'ARCHIVE_ASSET',
    'REACTIVATE_ASSET',
    'SYNC_DATA',
    'VIEW_AUDIT',
    'MANAGE_MEMBERS',
    'MANAGE_ROLES',
    'REMOVE_MEMBERS',
    'MANAGE_ORGANIZATION',
  ],
};

const DEFAULT_ENTERPRISE_ROSTER: OrganizationMember[] = [
  {
    id: 'mem-admin-01',
    organization_id: DEMO_ORG_ID,
    user_id: 'user-admin-01',
    role: 'admin',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    users: {
      email: 'admin@vulnfusion.internal',
      display_name: 'Administrator',
    },
  },
  {
    id: 'mem-analyst-02',
    organization_id: DEMO_ORG_ID,
    user_id: 'user-analyst-02',
    role: 'manager',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    users: {
      email: 'secops@vulnfusion.internal',
      display_name: 'Security Ops',
    },
  },
  {
    id: 'mem-viewer-03',
    organization_id: DEMO_ORG_ID,
    user_id: 'user-viewer-03',
    role: 'user',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    users: {
      email: 'viewer@vulnfusion.internal',
      display_name: 'Viewer',
    },
  },
];

export const RBACProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [role, setRole] = useState<OrgRole>('admin');
  const [members, setMembers] = useState<OrganizationMember[]>(DEFAULT_ENTERPRISE_ROSTER);
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(false);

  const fetchMembershipAndMembers = async () => {
    if (!isSupabaseConfigured || !currentUser) {
      setRole('admin');
      setMembers(DEFAULT_ENTERPRISE_ROSTER);
      return;
    }

    setIsLoadingMembers(true);
    try {
      // 1. Get current user's role in demo org
      const { data: myMember, error: myError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', DEMO_ORG_ID)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (!myError && myMember) {
        setRole((myMember.role as OrgRole) || 'admin');
      } else {
        setRole('admin');
      }

      // 2. Fetch all members for admin/manager view
      const { data: allMembers, error: membersError } = await supabase
        .from('organization_members')
        .select('id, organization_id, user_id, role, created_at, users(email, display_name)')
        .eq('organization_id', DEMO_ORG_ID);

      if (!membersError && allMembers && allMembers.length > 0) {
        setMembers(allMembers as any);
      } else {
        setMembers(DEFAULT_ENTERPRISE_ROSTER);
      }
    } catch (err) {
      console.error('Error fetching RBAC membership:', err);
      setMembers(DEFAULT_ENTERPRISE_ROSTER);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchMembershipAndMembers();
  }, [currentUser]);

  const can = (permission: Permission): boolean => {
    const allowedPermissions = PERMISSIONS_MAP[role] || PERMISSIONS_MAP['user'];
    return allowedPermissions.includes(permission);
  };

  const updateMemberRole = async (targetUserId: string, newRole: OrgRole): Promise<boolean> => {
    // Last admin protection check
    const currentMember = members.find(m => m.user_id === targetUserId);
    if (currentMember?.role === 'admin' && newRole !== 'admin') {
      const adminCount = members.filter(m => m.role === 'admin').length;
      if (adminCount <= 1) {
        console.error('Cannot demote the last administrator.');
        return false;
      }
    }

    if (!isSupabaseConfigured || !currentUser) {
      setMembers(prev =>
        prev.map(m => (m.user_id === targetUserId ? { ...m, role: newRole } : m))
      );
      return true;
    }

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('organization_id', DEMO_ORG_ID)
        .eq('user_id', targetUserId);

      if (error) {
        console.warn('Supabase update error, applying locally:', error.message);
        setMembers(prev =>
          prev.map(m => (m.user_id === targetUserId ? { ...m, role: newRole } : m))
        );
        return true;
      }

      await auditService.logEvent(
        DEMO_ORG_ID,
        currentUser.id,
        'MEMBER_ROLE_CHANGED',
        'user',
        targetUserId as any,
        { targetUserId, newRole, changedBy: currentUser.email }
      );

      await fetchMembershipAndMembers();
      return true;
    } catch (err) {
      console.error('Error updating member role:', err);
      setMembers(prev =>
        prev.map(m => (m.user_id === targetUserId ? { ...m, role: newRole } : m))
      );
      return true;
    }
  };

  const removeMember = async (targetUserId: string): Promise<boolean> => {
    // Last admin protection check
    const targetMember = members.find(m => m.user_id === targetUserId);
    if (targetMember?.role === 'admin') {
      const adminCount = members.filter(m => m.role === 'admin').length;
      if (adminCount <= 1) {
        console.error('Cannot remove the last administrator.');
        return false;
      }
    }

    if (!isSupabaseConfigured || !currentUser) {
      setMembers(prev => prev.filter(m => m.user_id !== targetUserId));
      return true;
    }

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', DEMO_ORG_ID)
        .eq('user_id', targetUserId);

      if (error) {
        console.warn('Supabase delete error, applying locally:', error.message);
        setMembers(prev => prev.filter(m => m.user_id !== targetUserId));
        return true;
      }

      await auditService.logEvent(
        DEMO_ORG_ID,
        currentUser.id,
        'MEMBER_REMOVED',
        'user',
        targetUserId as any,
        { targetUserId, removedBy: currentUser.email }
      );

      await fetchMembershipAndMembers();
      return true;
    } catch (err) {
      console.error('Error removing member:', err);
      setMembers(prev => prev.filter(m => m.user_id !== targetUserId));
      return true;
    }
  };

  const value = {
    role,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isUser: role === 'user',
    can,
    members,
    isLoadingMembers,
    updateMemberRole,
    removeMember,
    refreshMembers: fetchMembershipAndMembers,
  };

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
};

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};
