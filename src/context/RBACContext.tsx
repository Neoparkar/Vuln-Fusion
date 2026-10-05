import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { auditService } from '../services/auditService';
import { resolveSessionOrganization } from '../services/organizationService';
import {
  DEMO_ORGANIZATION_ID,
  evaluateMemberRemoval,
  evaluateMemberRoleChange,
  organizationScopeForSession,
} from '../tenancy/organizationAuthority';

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
const DEMO_ORG_ID = DEMO_ORGANIZATION_ID;

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

export function hasPermission(role: OrgRole, permission: Permission): boolean {
  const allowedPermissions = PERMISSIONS_MAP[role] || PERMISSIONS_MAP.user;
  return allowedPermissions.includes(permission);
}

export function isLastAdministratorChangeBlocked(
  members: { user_id: string; role: OrgRole }[],
  targetUserId: string,
  nextRole: OrgRole | null
): boolean {
  const target = members.find(member => member.user_id === targetUserId);
  if (!target || target.role !== 'admin') return false;
  if (nextRole === 'admin') return false;
  const adminCount = members.filter(member => member.role === 'admin').length;
  return adminCount <= 1;
}

export function readPresentationRole(user: { user_metadata?: Record<string, unknown> } | null, isDemoMode: boolean): OrgRole | null {
  if (!isDemoMode || user?.user_metadata?.is_demo_session !== true) return null;
  const role = user.user_metadata.role;
  if (role === 'admin' || role === 'manager' || role === 'user') return role;
  return 'user';
}

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
  const { currentUser, isDemoMode } = useAuth();
  const [role, setRole] = useState<OrgRole>('user');
  const presentationRole = readPresentationRole(currentUser, isDemoMode);
  const effectiveRole: OrgRole = presentationRole ?? role;
  const [members, setMembers] = useState<OrganizationMember[]>(DEFAULT_ENTERPRISE_ROSTER);
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(false);
  const [authorizedOrganizationId, setAuthorizedOrganizationId] = useState<string | null>(null);

  const fetchMembershipAndMembers = async () => {
    const activePresentationRole = readPresentationRole(currentUser, isDemoMode);
    if (activePresentationRole) {
      const scope = organizationScopeForSession({
        isPresentationSession: true,
        presentationRole: activePresentationRole,
        resolution: null,
      });
      setRole(scope.role);
      setAuthorizedOrganizationId(scope.organizationId);
      setMembers(DEFAULT_ENTERPRISE_ROSTER);
      setIsLoadingMembers(false);
      return;
    }

    if (!isSupabaseConfigured || !currentUser) {
      setRole('user');
      setAuthorizedOrganizationId(null);
      setMembers(DEFAULT_ENTERPRISE_ROSTER);
      return;
    }

    setIsLoadingMembers(true);
    try {
      const resolution = await resolveSessionOrganization();
      const scope = organizationScopeForSession({
        isPresentationSession: false,
        presentationRole: null,
        resolution,
      });
      setRole(scope.role);
      setAuthorizedOrganizationId(scope.organizationId);

      if (!scope.organizationId) {
        setMembers([]);
        return;
      }

      const { data: allMembers, error: membersError } = await supabase
        .from('organization_members')
        .select('id, organization_id, user_id, role, created_at, users(email, display_name)')
        .eq('organization_id', scope.organizationId);

      if (!membersError && allMembers) {
        setMembers(allMembers as any);
      } else {
        setRole('user');
        setAuthorizedOrganizationId(null);
        setMembers([]);
      }
    } catch (err) {
      console.error('Error fetching RBAC membership:', err);
      setRole('user');
      setAuthorizedOrganizationId(null);
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchMembershipAndMembers();
  }, [currentUser, isDemoMode]);

  const can = (permission: Permission): boolean => hasPermission(effectiveRole, permission);

  const updateMemberRole = async (targetUserId: string, newRole: OrgRole): Promise<boolean> => {
    if (!can('MANAGE_ROLES')) return false;
    if (isLastAdministratorChangeBlocked(members, targetUserId, newRole)) {
      console.error('Cannot demote the last administrator.');
      return false;
    }

    if (isDemoMode) {
      setMembers(prev =>
        prev.map(m => (m.user_id === targetUserId ? { ...m, role: newRole } : m))
      );
      return true;
    }

    if (!isSupabaseConfigured || !currentUser || !authorizedOrganizationId) return false;
    const roleDecision = evaluateMemberRoleChange({
      actorUserId: currentUser.id,
      members: members.map(member => ({ userId: member.user_id, role: member.role })),
      targetUserId,
      nextRole: newRole,
    });
    if (!roleDecision.allowed) return false;

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('organization_id', authorizedOrganizationId)
        .eq('user_id', targetUserId);

      if (error) {
        console.warn('Supabase update denied; local roster was not changed:', error.message);
        return false;
      }

      await auditService.logEvent(
        authorizedOrganizationId,
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
      return false;
    }
  };

  const removeMember = async (targetUserId: string): Promise<boolean> => {
    if (!can('REMOVE_MEMBERS')) return false;
    if (isLastAdministratorChangeBlocked(members, targetUserId, null)) {
      console.error('Cannot remove the last administrator.');
      return false;
    }

    if (isDemoMode) {
      setMembers(prev => prev.filter(m => m.user_id !== targetUserId));
      return true;
    }

    if (!isSupabaseConfigured || !currentUser || !authorizedOrganizationId) return false;
    const removalDecision = evaluateMemberRemoval({
      actorUserId: currentUser.id,
      members: members.map(member => ({ userId: member.user_id, role: member.role })),
      targetUserId,
    });
    if (!removalDecision.allowed) return false;

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', authorizedOrganizationId)
        .eq('user_id', targetUserId);

      if (error) {
        console.warn('Supabase delete denied; local roster was not changed:', error.message);
        return false;
      }

      await auditService.logEvent(
        authorizedOrganizationId,
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
      return false;
    }
  };

  const value = {
    role: effectiveRole,
    isAdmin: effectiveRole === 'admin',
    isManager: effectiveRole === 'manager',
    isUser: effectiveRole === 'user',
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
