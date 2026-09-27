import React, { useState } from 'react';
import { useRBAC, OrgRole } from '../context/RBACContext';
import {
  Shield,
  Users,
  Lock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  Trash2,
  Edit3,
  X,
  Key,
  Database,
  Building,
} from 'lucide-react';
import { AuditLogEntry } from '../types/vulnfusion';

interface AdminManagementTabProps {
  auditLogs: AuditLogEntry[];
}

export const AdminManagementTab: React.FC<AdminManagementTabProps> = ({ auditLogs }) => {
  const { role, isAdmin, members, updateMemberRole, removeMember, refreshMembers } = useRBAC();
  const [subTab, setSubTab] = useState<'users' | 'org' | 'security' | 'audit'>('users');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<OrgRole>('user');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="p-6 rounded-2xl bg-[#0D1826] border border-rose-500/30 text-rose-300">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-rose-400" />
          <h2 className="text-lg font-bold mb-1">Access Denied</h2>
          <p className="text-xs text-slate-300 font-mono">
            You don't have permission to perform this action. Administration controls require Organization Administrator privileges.
          </p>
        </div>
      </div>
    );
  }

  const handleSaveRole = async (userId: string) => {
    setActionMessage(null);
    const success = await updateMemberRole(userId, selectedNewRole);
    if (success) {
      setActionMessage({ type: 'success', text: 'Member role updated successfully.' });
      setEditingUserId(null);
    } else {
      setActionMessage({ type: 'error', text: 'Failed to update role. Ensure you are not removing the last admin.' });
    }
  };

  const handleRemove = async (userId: string) => {
    setActionMessage(null);
    const success = await removeMember(userId);
    if (success) {
      setActionMessage({ type: 'success', text: 'Member removed from organization successfully.' });
      setConfirmDeleteUserId(null);
    } else {
      setActionMessage({ type: 'error', text: 'Failed to remove member. Cannot remove the last organization administrator.' });
      setConfirmDeleteUserId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1B3045]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Enterprise Administration
            </span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> RBAC Enforced
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-[#F4F7FB] tracking-tight">
            Organization Administration & Security
          </h1>
          <p className="text-xs text-[#8B95A5] font-mono">
            Manage organization membership, enterprise roles, security configuration, and audit trails.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-1.5 bg-[#0B1420] border border-[#1B3045] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSubTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'users'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users & Roles</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('org')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'org'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Organization</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'security'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'audit'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
          actionMessage.type === 'success'
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-tab 1: Users & Roles */}
      {subTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Organization Members</h2>
              <p className="text-xs text-slate-400 font-mono">Manage active user accounts, roles (Admin, Manager, User), and access permissions.</p>
            </div>
            <button
              onClick={() => refreshMembers()}
              className="px-3 py-1.5 bg-[#0D1826] hover:bg-[#132338] text-[#00B8FF] border border-[#1B3045] rounded-xl text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors"
            >
              <span>Refresh Roster</span>
            </button>
          </div>

          <div className="bg-[#071019] border border-[#1B3045] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0B1522] border-b border-[#1B3045] text-[11px] font-mono text-[#8B95A5] uppercase">
                    <th className="px-5 py-3 font-semibold">User / Email</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Joined</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#132236] text-xs font-sans">
                  {members.map((member) => {
                    const email = member.users?.email || member.user_id;
                    const isEditing = editingUserId === member.user_id;

                    return (
                      <tr key={member.id} className="hover:bg-[#0B1522]/50 transition-colors">
                        <td className="px-5 py-4 font-medium text-slate-200 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#0D1826] border border-[#1B3045] text-[#00B8FF] flex items-center justify-center font-bold font-mono">
                            {email.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold block text-slate-100">{member.users?.display_name || email.split('@')[0]}</span>
                            <span className="text-[11px] text-[#718197] font-mono">{email}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={selectedNewRole}
                                onChange={(e) => setSelectedNewRole(e.target.value as OrgRole)}
                                className="bg-[#0B1420] border border-[#1B3045] rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#00B8FF]"
                              >
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="user">User</option>
                              </select>
                              <button
                                onClick={() => handleSaveRole(member.user_id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="px-2.5 py-1 bg-[#152438] hover:bg-[#1D314D] text-slate-300 rounded-lg text-xs font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${
                              member.role === 'admin'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                : member.role === 'manager'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                            }`}>
                              {member.role}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#8B95A5] font-mono text-[11px]">
                          {new Date(member.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {!isEditing && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingUserId(member.user_id);
                                  setSelectedNewRole(member.role);
                                }}
                                className="p-2 bg-[#0D1826] hover:bg-[#152538] text-slate-300 rounded-xl border border-[#1B3045] transition-colors"
                                title="Change Role"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteUserId(member.user_id)}
                                className="p-2 bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 rounded-xl border border-rose-500/30 transition-colors"
                                title="Remove Member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confirm Removal Modal */}
          {confirmDeleteUserId && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#09101A] border border-[#1B3045] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-3 text-rose-400">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <h3 className="text-base font-bold text-white">Confirm Member Removal</h3>
                </div>
                <p className="text-xs text-slate-300 font-sans">
                  Are you sure you want to remove this member from the VulnFusion organization? They will immediately lose access to all workspaces and data.
                </p>
                <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 font-mono">
                  Note: The system enforces Last Administrator Protection and will block removal if this is the sole remaining administrator.
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setConfirmDeleteUserId(null)}
                    className="px-4 py-2 bg-[#0D1826] hover:bg-[#152438] text-slate-300 rounded-xl text-xs font-semibold border border-[#1B3045]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRemove(confirmDeleteUserId)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Confirm Removal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 2: Organization Settings */}
      {subTab === 'org' && (
        <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-200">Organization Settings</h2>
            <p className="text-xs text-slate-400 font-mono">Tenant identification and synchronization configuration.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-[#0B1522] border border-[#1B3045] rounded-xl space-y-2">
              <label className="text-xs font-mono text-slate-400 block">Organization Name</label>
              <input
                type="text"
                readOnly
                value="VulnFusion Demo"
                className="w-full bg-[#071019] border border-[#1B3045] rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div className="p-4 bg-[#0B1522] border border-[#1B3045] rounded-xl space-y-2">
              <label className="text-xs font-mono text-slate-400 block">Organization ID (UUID)</label>
              <input
                type="text"
                readOnly
                value="00000000-0000-0000-0000-000000000001"
                className="w-full bg-[#071019] border border-[#1B3045] rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Security Configuration */}
      {subTab === 'security' && (
        <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-200">Enterprise Security & RLS Policies</h2>
            <p className="text-xs text-slate-400 font-mono">Active security controls, database RLS status, and AI explanation boundary.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#0B1522] border border-[#1B3045] rounded-xl space-y-2">
              <div className="text-emerald-400 font-bold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Supabase RLS Enforced
              </div>
              <p className="text-xs text-slate-400 font-sans">Row-Level Security is active across all tenant tables with role-based checks.</p>
            </div>
            <div className="p-4 bg-[#0B1522] border border-[#1B3045] rounded-xl space-y-2">
              <div className="text-cyan-400 font-bold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> AI Explanation Only
              </div>
              <p className="text-xs text-slate-400 font-sans">Gemini AI model is strictly restricted to explanations with zero decision authority.</p>
            </div>
            <div className="p-4 bg-[#0B1522] border border-[#1B3045] rounded-xl space-y-2">
              <div className="text-indigo-400 font-bold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Last-Admin Protected
              </div>
              <p className="text-xs text-slate-400 font-sans">Database rules prevent removal or demotion of the final administrator.</p>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 4: Audit Trail */}
      {subTab === 'audit' && (
        <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-200">Session Audit Trail</h2>
            <p className="text-xs text-slate-400 font-mono">Chronological event log of security actions, role updates, and system operations.</p>
          </div>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.entryId} className="p-3 bg-[#0B1522] border border-[#1B3045] rounded-xl flex items-center justify-between text-xs font-mono">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-bold">
                      {log.action}
                    </span>
                    <span className="text-slate-200 font-bold">{log.targetId}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] font-sans">{log.details}</p>
                </div>
                <div className="text-right text-[10px] text-[#718197] shrink-0">
                  <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                  <div className="text-slate-500">{log.actor}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
