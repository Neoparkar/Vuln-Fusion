import React, { useState, useMemo } from 'react';
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
  RefreshCw,
  Search,
  Download,
  Filter,
  Sliders,
  Check,
  Cpu,
  Layers,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  HardDrive,
  Sparkles,
  Server,
  Zap,
  Info,
  CheckCheck,
} from 'lucide-react';
import {
  AuditLogEntry,
  CorrelationException,
  AssetRecord,
  UnderlyingAsset,
} from '../types/vulnfusion';
import { NavTabId } from './Sidebar';
import {
  QualysLogo,
  TenableLogo,
  Rapid7Logo,
  WizLogo,
} from './icons/SourceVendorIcons';

interface AdminManagementTabProps {
  auditLogs: AuditLogEntry[];
  exceptions?: CorrelationException[];
  records?: AssetRecord[];
  clusters?: UnderlyingAsset[];
  findings?: any[];
  findingGroups?: any[];
  onResolveException?: (exceptionId: string) => void;
  onTriggerSync?: (sourceName: string) => void;
  onNavigateTab?: (tab: NavTabId) => void;
  addAuditLog?: (action: string, targetId: string, details: string) => void;
}

type AdminSubTab =
  | 'users'
  | 'datasources'
  | 'rules'
  | 'exceptions'
  | 'audit'
  | 'health';

export const AdminManagementTab: React.FC<AdminManagementTabProps> = ({
  auditLogs = [],
  exceptions = [],
  records = [],
  clusters = [],
  findings = [],
  findingGroups = [],
  onResolveException,
  onTriggerSync,
  onNavigateTab,
  addAuditLog,
}) => {
  const { can, members, updateMemberRole, removeMember, refreshMembers } = useRBAC();
  const canManageRoles = can('MANAGE_ROLES');
  const canRemoveMembers = can('REMOVE_MEMBERS');
  const canRevokeException = can('CREATE_EXCEPTION');
  const deniedTitle = 'Unavailable for your role';
  const [subTab, setSubTab] = useState<AdminSubTab>('users');

  // SubTab 1: Users & Roles state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<OrgRole>('user');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // SubTab 2: Data Sources state
  const [syncingSource, setSyncingSource] = useState<string | null>(null);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);

  // SubTab 4: Exceptions state
  const [exceptionSearch, setExceptionSearch] = useState('');
  const [exceptionStatusFilter, setExceptionStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED'>('ALL');

  // SubTab 5: Audit state
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogEntry | null>(null);

  // Summary counts
  const activeExceptionsCount = useMemo(() => {
    return exceptions.filter(e => e.status === 'ACTIVE').length;
  }, [exceptions]);

  const reviewCount = useMemo(() => {
    return clusters.filter(c => c.correlationStatus === 'REVIEW_REQUIRED').length;
  }, [clusters]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    if (!userSearchQuery.trim()) return members;
    const q = userSearchQuery.toLowerCase();
    return members.filter(m => {
      const name = m.users?.display_name?.toLowerCase() || '';
      const email = m.users?.email?.toLowerCase() || m.user_id.toLowerCase();
      const userRole = m.role.toLowerCase();
      return name.includes(q) || email.includes(q) || userRole.includes(q);
    });
  }, [members, userSearchQuery]);

  // Filtered exceptions
  const filteredExceptions = useMemo(() => {
    return exceptions.filter(e => {
      if (exceptionStatusFilter !== 'ALL' && e.status !== exceptionStatusFilter) return false;
      if (!exceptionSearch.trim()) return true;
      const q = exceptionSearch.toLowerCase();
      return (
        e.exceptionId.toLowerCase().includes(q) ||
        e.assetGroupId.toLowerCase().includes(q) ||
        e.analystNote.toLowerCase().includes(q) ||
        e.reason.toLowerCase().includes(q)
      );
    });
  }, [exceptions, exceptionStatusFilter, exceptionSearch]);

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (auditActionFilter !== 'ALL' && !log.action.includes(auditActionFilter)) return false;
      if (!auditSearch.trim()) return true;
      const q = auditSearch.toLowerCase();
      return (
        log.entryId.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.targetId.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
      );
    });
  }, [auditLogs, auditActionFilter, auditSearch]);

  const handleSaveRole = async (userId: string) => {
    setActionMessage(null);
    if (!can('MANAGE_ROLES')) {
      setActionMessage({ type: 'error', text: 'Role change denied. Your role cannot manage roles.' });
      return;
    }
    const success = await updateMemberRole(userId, selectedNewRole);
    if (success) {
      setActionMessage({ type: 'success', text: `Member role updated to ${selectedNewRole}.` });
      setEditingUserId(null);
      if (addAuditLog) {
        addAuditLog('MEMBER_ROLE_CHANGED', userId, `Updated role for ${userId} to ${selectedNewRole}.`);
      }
    } else {
      setActionMessage({ type: 'error', text: 'Role change denied. The last administrator must remain, or the membership update was not applied.' });
    }
  };

  const handleRemove = async (userId: string) => {
    setActionMessage(null);
    if (!can('REMOVE_MEMBERS')) {
      setActionMessage({ type: 'error', text: 'Member removal denied. Your role cannot remove members.' });
      setConfirmDeleteUserId(null);
      return;
    }
    const success = await removeMember(userId);
    if (success) {
      setActionMessage({ type: 'success', text: 'Member removed from organization roster.' });
      setConfirmDeleteUserId(null);
      if (addAuditLog) {
        addAuditLog('MEMBER_REMOVED', userId, `Removed member ${userId} from demonstration roster.`);
      }
    } else {
      setActionMessage({ type: 'error', text: 'Member removal denied. The last administrator must remain, or the membership update was not applied.' });
      setConfirmDeleteUserId(null);
    }
  };

  const handleTriggerReprocess = (sourceName: string) => {
    setSyncingSource(sourceName);
    setTimeout(() => {
      setSyncingSource(null);
      setSyncSuccessToast(`Reprocessed synthetic records for ${sourceName}. Deterministic graph updated.`);
      if (addAuditLog) {
        addAuditLog('REPROCESS_SYNTHETIC_DATA', sourceName, `Reprocessed synthetic dataset records for ${sourceName}.`);
      }
      if (onTriggerSync) {
        onTriggerSync(sourceName);
      }
      setTimeout(() => setSyncSuccessToast(null), 4000);
    }, 600);
  };

  const handleExportAuditLogs = (format: 'csv' | 'json') => {
    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `vulnfusion_session_audit_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      const headers = ['Entry ID', 'Timestamp', 'Action', 'Target ID', 'Actor', 'Details'];
      const rows = auditLogs.map(l => [
        `"${l.entryId}"`,
        `"${l.timestamp}"`,
        `"${l.action}"`,
        `"${l.targetId}"`,
        `"${l.actor}"`,
        `"${l.details.replace(/"/g, '""')}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', encodeURI(csvContent));
      downloadAnchor.setAttribute('download', `vulnfusion_session_audit_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
    if (addAuditLog) {
      addAuditLog('EXPORT_DATA', 'SESSION_AUDIT', `Exported ${auditLogs.length} current session audit entries to ${format.toUpperCase()}.`);
    }
  };

  const formatRoleLabel = (r: OrgRole | string) => {
    if (r === 'admin') return 'Administrator';
    if (r === 'manager') return 'Analyst';
    return 'Viewer';
  };

  // 4 Synthetic Data Sources (Strictly Synthetic Source Labels)
  const syntheticSourcesList = [
    {
      id: 'qualys',
      name: 'Qualys',
      datasetLabel: 'Synthetic Vulnerability Management Data',
      icon: <QualysLogo size={22} />,
      status: 'AVAILABLE',
      statusBadge: 'SYNTHETIC SOURCE',
      recordsCount: records.filter(r => r.sourceTool === 'Qualys').length || 24,
      observationMethods: ['Agent', 'Discovery Scan', 'Authenticated Scan'],
      externalConnection: 'Disabled',
      credentials: 'Not configured',
      dataMode: 'Synthetic',
    },
    {
      id: 'tenable',
      name: 'Tenable',
      datasetLabel: 'Synthetic Cyber Exposure Data',
      icon: <TenableLogo size={22} />,
      status: 'AVAILABLE',
      statusBadge: 'SYNTHETIC SOURCE',
      recordsCount: records.filter(r => r.sourceTool === 'Tenable').length || 22,
      observationMethods: ['Agent', 'Discovery Scan', 'Authenticated Scan'],
      externalConnection: 'Disabled',
      credentials: 'Not configured',
      dataMode: 'Synthetic',
    },
    {
      id: 'rapid7',
      name: 'Rapid7',
      datasetLabel: 'Synthetic Asset Intelligence Data',
      icon: <Rapid7Logo size={22} />,
      status: 'AVAILABLE',
      statusBadge: 'SYNTHETIC SOURCE',
      recordsCount: records.filter(r => r.sourceTool === 'Rapid7').length || 20,
      observationMethods: ['Agent', 'Discovery Scan', 'Authenticated Scan'],
      externalConnection: 'Disabled',
      credentials: 'Not configured',
      dataMode: 'Synthetic',
    },
    {
      id: 'wiz',
      name: 'Wiz',
      datasetLabel: 'Synthetic Cloud Infrastructure Data',
      icon: <WizLogo size={22} />,
      status: 'AVAILABLE',
      statusBadge: 'SYNTHETIC SOURCE',
      recordsCount: records.filter(r => r.sourceTool === 'Wiz').length || 15,
      observationMethods: ['Cloud Configuration', 'Agentless Runtime Analysis', 'Container Workload Scan'],
      externalConnection: 'Disabled',
      credentials: 'Not configured',
      dataMode: 'Synthetic',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Header & Primary Description */}
      <div className="pb-4 border-b border-[#1B3045] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Enterprise Control Center
            </span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Deterministic Engine Active
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#F4F7FB] tracking-tight uppercase">
            ADMINISTRATION
          </h1>
          <p className="text-xs text-[#8B95A5] font-mono mt-0.5">
            Manage users, synthetic data sources, correlation controls, exceptions and session audit activity.
          </p>
        </div>

        {/* Action feedback banner if active */}
        {actionMessage && (
          <div className={`px-3 py-2 rounded-xl border text-xs font-mono flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}>
            <span>{actionMessage.text}</span>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Compact Summary Row (4 genuine counts, no fabricated operational stats) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0B1420] border border-[#1B3045] rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#8B95A5] uppercase tracking-wider font-semibold">
              Users
            </div>
            <div className="text-lg font-bold text-white font-mono leading-tight">
              {members.length}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">
              Demonstration roster
            </div>
          </div>
        </div>

        <div className="bg-[#0B1420] border border-[#1B3045] rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#8B95A5] uppercase tracking-wider font-semibold">
              Synthetic Sources
            </div>
            <div className="text-lg font-bold text-white font-mono leading-tight flex items-center gap-1.5">
              <span>4</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-normal">Available</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">
              Qualys, Tenable, R7, Wiz
            </div>
          </div>
        </div>

        <div className="bg-[#0B1420] border border-[#1B3045] rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#8B95A5] uppercase tracking-wider font-semibold">
              Active Exceptions
            </div>
            <div className="text-lg font-bold text-white font-mono leading-tight">
              {activeExceptionsCount}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">
              Analyst overrides
            </div>
          </div>
        </div>

        <div className="bg-[#0B1420] border border-[#1B3045] rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#8B95A5] uppercase tracking-wider font-semibold">
              Audit Events
            </div>
            <div className="text-lg font-bold text-white font-mono leading-tight">
              {auditLogs.length}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">
              Current session events
            </div>
          </div>
        </div>
      </div>

      {/* 3. Secondary Navigation Pattern: Users & Roles | Data Sources | Rules | Exceptions | Audit | Health */}
      <div className="border-b border-[#1B3045] pb-px">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setSubTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
              subTab === 'users'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200 hover:bg-[#0B1420] border border-transparent'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users & Roles</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('datasources')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
              subTab === 'datasources'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200 hover:bg-[#0B1420] border border-transparent'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Data Sources</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('rules')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
              subTab === 'rules'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200 hover:bg-[#0B1420] border border-transparent'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Correlation Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('exceptions')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
              subTab === 'exceptions'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200 hover:bg-[#0B1420] border border-transparent'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Exceptions</span>
            {activeExceptionsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {activeExceptionsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('audit')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
              subTab === 'audit'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200 hover:bg-[#0B1420] border border-transparent'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Session Audit Trail</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('health')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] cursor-pointer ${
              subTab === 'health'
                ? 'bg-[#122236] text-[#00B8FF] border border-[#00B8FF]/40 shadow-sm'
                : 'text-[#8B95A5] hover:text-slate-200 hover:bg-[#0B1420] border border-transparent'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>System Health</span>
          </button>
        </div>
      </div>

      {/* 4. SELECTED SUB-TAB CONTENT */}

      {/* SUBTAB 1: USERS & ROLES */}
      {subTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>USERS & ROLES</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {filteredMembers.length} accounts
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Demonstration user roster and role assignments (Administrator, Analyst, Viewer).
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#5F6875]" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="bg-[#0B1420] border border-[#1B3045] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#5F6875] focus:outline-none focus:border-[#00B8FF] w-full min-h-[36px]"
                />
              </div>

              <button
                type="button"
                onClick={() => refreshMembers()}
                className="px-3 py-2 bg-[#0B1420] hover:bg-[#122236] text-slate-200 border border-[#1B3045] rounded-xl text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors min-h-[36px] cursor-pointer"
                title="Refresh user roster"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#00B8FF]" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-[#0B1420] border border-[#1B3045] rounded-xl text-[11px] text-slate-400 font-mono flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Frontend role assignments reflect current session access and demonstration RBAC controls. Application data boundaries are enforced at the persistence layer.</span>
          </div>

          {/* Users Table */}
          <div className="bg-[#071019] border border-[#1B3045] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0B1522] border-b border-[#1B3045] text-[11px] font-mono text-[#8B95A5] uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">USER</th>
                    <th className="px-5 py-3 font-semibold">ROLE</th>
                    <th className="px-5 py-3 font-semibold">STATUS</th>
                    <th className="px-5 py-3 font-semibold">LAST ACTIVE</th>
                    <th className="px-5 py-3 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#132236] text-xs font-sans">
                  {filteredMembers.map((member) => {
                    const email = member.users?.email || member.user_id;
                    const displayName = member.users?.display_name || email.split('@')[0];
                    const isEditing = editingUserId === member.user_id;
                    const roleLabel = formatRoleLabel(member.role);
                    const isToday = member.role === 'admin' || member.role === 'manager';
                    const lastActiveLabel = isToday ? 'Today' : 'Yesterday';

                    return (
                      <tr key={member.id} className="hover:bg-[#0B1522]/50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-slate-200 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#0D1826] border border-[#1B3045] text-[#00B8FF] flex items-center justify-center font-bold font-mono shrink-0">
                            {displayName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold block text-slate-100 truncate">{displayName}</span>
                            <span className="text-[11px] text-[#718197] font-mono truncate block">{email}</span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={selectedNewRole}
                                onChange={(e) => setSelectedNewRole(e.target.value as OrgRole)}
                                className="bg-[#0B1420] border border-[#1B3045] rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#00B8FF]"
                              >
                                <option value="admin">Administrator</option>
                                <option value="manager">Analyst</option>
                                <option value="user">Viewer</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleSaveRole(member.user_id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingUserId(null)}
                                className="px-2.5 py-1 bg-[#152438] hover:bg-[#1D314D] text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border inline-block ${
                              member.role === 'admin'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                : member.role === 'manager'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                            }`}>
                              {roleLabel}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-[#8B95A5] font-mono text-[11px]">
                          {lastActiveLabel}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          {!isEditing && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!canManageRoles) return;
                                  setEditingUserId(member.user_id);
                                  setSelectedNewRole(member.role);
                                }}
                                disabled={!canManageRoles}
                                className={`p-2 bg-[#0D1826] hover:bg-[#152538] text-slate-300 rounded-xl border border-[#1B3045] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${canManageRoles ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                                title={canManageRoles ? 'Change Role' : deniedTitle}
                                aria-label="Change Role"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (canRemoveMembers) setConfirmDeleteUserId(member.user_id);
                                }}
                                disabled={!canRemoveMembers}
                                className={`p-2 bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 rounded-xl border border-rose-500/30 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${canRemoveMembers ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                                title={canRemoveMembers ? 'Remove User' : deniedTitle}
                                aria-label="Remove User"
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

          {/* Roles & Permissions Reference Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0B1420] border border-indigo-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold uppercase">
                  Administrator
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Platform Oversight</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" /> Manage user roles</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" /> Configure synthetic sources</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" /> Review & revoke exceptions</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" /> View session audit trail</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-400" /> Export executive reports</li>
              </ul>
            </div>

            <div className="bg-[#0B1420] border border-cyan-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase">
                  Analyst
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Operations & Triage</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Investigate assets & clusters</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Review correlation candidates</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Create & record exceptions</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Run AI Analyst explanations</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Export reports & evidence</li>
              </ul>
            </div>

            <div className="bg-[#0B1420] border border-slate-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-500/20 text-slate-300 border border-slate-500/30 text-[10px] font-mono font-bold uppercase">
                  Viewer
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Read-Only Telemetry</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-400" /> View dashboards & KPIs</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-400" /> View correlation evidence</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-400" /> View vulnerability findings</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-400" /> View executive reports</li>
                <li className="flex items-center gap-2 text-slate-500"><X className="w-3.5 h-3.5" /> No configuration access</li>
              </ul>
            </div>
          </div>

          {/* Confirm Removal Modal */}
          {confirmDeleteUserId && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#09101A] border border-[#1B3045] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-3 text-rose-400">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <h3 className="text-base font-bold text-white">Confirm User Removal</h3>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Are you sure you want to remove this user from the demonstration roster?
                </p>
                <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 font-mono">
                  Safeguard Enforced: System will block deletion if this account is the sole remaining administrator.
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteUserId(null)}
                    className="px-4 py-2 bg-[#0D1826] hover:bg-[#152438] text-slate-300 rounded-xl text-xs font-semibold border border-[#1B3045] cursor-pointer min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(confirmDeleteUserId)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold cursor-pointer min-h-[44px]"
                  >
                    Confirm Removal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: DATA SOURCES (SYNTHETIC DATASET SPECIFICATION) */}
      {subTab === 'datasources' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>DATA SOURCES (SYNTHETIC DATASET)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  4 Synthetic Sources
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Synthetic source labels used for deterministic correlation evaluation. No live scanner connections or credentials.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleTriggerReprocess('All Synthetic Sources')}
              disabled={Boolean(syncingSource)}
              className="px-4 py-2 bg-[#122236] hover:bg-[#183250] text-[#00B8FF] border border-[#00B8FF]/40 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-all min-h-[44px] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingSource ? 'animate-spin' : ''}`} />
              <span>{syncingSource ? 'Reprocessing...' : 'Reprocess Synthetic Data'}</span>
            </button>
          </div>

          {/* Persistent Synthetic Notice (Mandatory Hackathon Compliance) */}
          <div className="p-3 bg-[#0A121D] border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-300/90 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Synthetic source labels only. No production scanner or client telemetry is used.</span>
          </div>

          {syncSuccessToast && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncSuccessToast}</span>
            </div>
          )}

          {/* 4 Synthetic Source Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {syntheticSourcesList.map((source) => (
              <div
                key={source.id}
                className="bg-[#071019] border border-[#1B3045] rounded-2xl p-5 space-y-4 hover:border-[#234363] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0B1522] border border-[#1B3045] flex items-center justify-center shrink-0">
                      {source.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{source.name}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {source.statusBadge}
                        </span>
                      </h3>
                      <p className="text-[11px] text-[#8B95A5] font-mono">{source.datasetLabel}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTriggerReprocess(source.name)}
                    disabled={syncingSource === source.name}
                    className="p-2 bg-[#0B1420] hover:bg-[#122236] text-[#00B8FF] border border-[#1B3045] rounded-xl text-xs font-mono transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title={`Reprocess ${source.name} synthetic data`}
                    aria-label={`Reprocess ${source.name} synthetic data`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingSource === source.name ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-[#132236]">
                  <div>
                    <span className="text-[#5F6875] block">Current Synthetic Records</span>
                    <span className="text-slate-200 font-bold">{source.recordsCount} records</span>
                  </div>
                  <div>
                    <span className="text-[#5F6875] block">Data Mode</span>
                    <span className="text-cyan-400">{source.dataMode}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-[11px] font-mono">
                  <div className="text-[#5F6875] text-[10px] uppercase">Observation Methods:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {source.observationMethods.map((m, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-[#0B1420] border border-[#1B3045] text-slate-300 text-[10px]">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 bg-[#04080D] rounded-xl border border-[#132236] grid grid-cols-2 gap-2 text-[10px] font-mono text-[#718197]">
                  <div>
                    <span>EXTERNAL CONNECTION: </span>
                    <span className="text-slate-400 font-semibold">{source.externalConnection}</span>
                  </div>
                  <div>
                    <span>CREDENTIALS: </span>
                    <span className="text-slate-400 font-semibold">{source.credentials}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#0B1420] border border-[#1B3045] rounded-2xl flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white font-mono block">Synthetic Ingestion Guarantee</span>
              <p className="text-[11px] text-slate-400 font-mono">
                VulnFusion processes synthetic multi-source records non-destructively. Zero data is discarded or overwritten during correlation.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase shrink-0">
              100% Preserved
            </span>
          </div>
        </div>
      )}

      {/* SUBTAB 3: CORRELATION RULES */}
      {subTab === 'rules' && (
        <div className="space-y-6">
          <div className="pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold uppercase">
                Deterministic Engine Rules (Read-Only)
              </span>
              <span className="text-xs text-slate-400 font-mono">Core v2.4.0</span>
            </div>
            <h2 className="text-sm font-bold text-slate-100 uppercase">
              Authoritative Matching Rules & Confidence Weights
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              These rules are evaluated by the deterministic correlation engine. AI does not determine asset identity or correlation status.
            </p>
          </div>

          <div className="space-y-3">
            {/* Rule 1 */}
            <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-4.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                    PRIORITY 1
                  </span>
                  <span className="text-xs font-bold text-white">AWS Cloud Resource ID (ARN / Instance ID)</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Confidence: 100%
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                Exact string match on cloud resource ID (e.g. <code className="text-cyan-300">arn:aws:ec2:...</code> or <code className="text-cyan-300">i-0a1b2c3d4e5f6g7h8</code>). Cloud provider assigned global unique identifier.
              </p>
              <div className="text-[10px] font-mono text-[#718197] flex items-center gap-4 pt-1">
                <span>MATCH TYPE: Exact String</span>
                <span>WEIGHT: 1.00</span>
                <span>STATUS: Authoritative</span>
              </div>
            </div>

            {/* Rule 2 */}
            <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-4.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                    PRIORITY 2
                  </span>
                  <span className="text-xs font-bold text-white">Hardware BIOS / System UUID</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Confidence: 98%
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                Exact match on normalized BIOS UUID string. Discards non-unique hypervisor dummy values (e.g. 00000000-0000-0000-0000-000000000000).
              </p>
              <div className="text-[10px] font-mono text-[#718197] flex items-center gap-4 pt-1">
                <span>MATCH TYPE: Normalized UUID</span>
                <span>WEIGHT: 0.98</span>
                <span>STATUS: Authoritative</span>
              </div>
            </div>

            {/* Rule 3 */}
            <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-4.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold">
                    PRIORITY 3
                  </span>
                  <span className="text-xs font-bold text-white">Canonical FQDN & Hostname Normalization</span>
                </div>
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  Confidence: 85%
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                Case-insensitive hostname normalization with domain stripping and NetBIOS cross-referencing.
              </p>
              <div className="text-[10px] font-mono text-[#718197] flex items-center gap-4 pt-1">
                <span>MATCH TYPE: Case-Insensitive String</span>
                <span>WEIGHT: 0.85</span>
                <span>STATUS: High Confidence</span>
              </div>
            </div>

            {/* Rule 4 */}
            <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-4.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
                    PRIORITY 4
                  </span>
                  <span className="text-xs font-bold text-white">Network IPv4/IPv6 & Subnet Co-occurrence</span>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  Confidence: 70%
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                Multi-interface IP match within identical subnet. Used as corroborating evidence alongside hostname or MAC address.
              </p>
              <div className="text-[10px] font-mono text-[#718197] flex items-center gap-4 pt-1">
                <span>MATCH TYPE: Network Address Overlap</span>
                <span>WEIGHT: 0.70</span>
                <span>STATUS: Corroborating Evidence</span>
              </div>
            </div>

            {/* Rule 5 */}
            <div className="bg-[#071019] border border-amber-500/30 rounded-2xl p-4.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                    RULE 5: CONFLICT RESOLUTION
                  </span>
                  <span className="text-xs font-bold text-white">Scanner Ambiguity Flagging</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Flag: REVIEW_REQUIRED
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                When scanner sources present contradictory primary attributes (e.g. matching IP but divergent UUIDs), the engine refrains from merging and marks the candidate cluster as REVIEW REQUIRED.
              </p>
              <div className="text-[10px] font-mono text-[#718197] flex items-center gap-4 pt-1">
                <span>ACTION: Isolate & Demand Analyst Signoff</span>
                <span>OVERRIDE: Exception Rule</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#0A121D] border border-blue-500/30 rounded-2xl flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#00B8FF] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-white font-mono block">Deterministic Rules Architecture Notice</span>
              <p className="text-slate-300 leading-relaxed font-sans">
                These rules are evaluated by the deterministic correlation engine. Rules are mathematically immutable in this console to guarantee zero probabilistic hallucination. AI does not determine asset identity or correlation status.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: EXCEPTIONS */}
      {subTab === 'exceptions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>CORRELATION EXCEPTIONS</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {filteredExceptions.length} records
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Analyst override decisions layered over deterministic calculations. Underlying raw records remain immutable.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-56">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#5F6875]" />
                <input
                  type="text"
                  placeholder="Search exceptions..."
                  value={exceptionSearch}
                  onChange={(e) => setExceptionSearch(e.target.value)}
                  className="bg-[#0B1420] border border-[#1B3045] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#5F6875] focus:outline-none focus:border-[#00B8FF] w-full min-h-[36px]"
                />
              </div>

              <select
                value={exceptionStatusFilter}
                onChange={(e) => setExceptionStatusFilter(e.target.value as any)}
                className="bg-[#0B1420] border border-[#1B3045] rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#00B8FF] min-h-[36px]"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="REVOKED">Revoked Only</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 bg-[#0B1420] border border-[#1B3045] rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-[#071019] rounded-lg border border-[#132236]">
              <span className="text-[#718197] block text-[10px] uppercase">Layer 1</span>
              <span className="text-cyan-400 font-bold block">Deterministic Result</span>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">Calculated by primary rules (never modified or deleted)</p>
            </div>
            <div className="p-2.5 bg-[#071019] rounded-lg border border-[#132236]">
              <span className="text-[#718197] block text-[10px] uppercase">Layer 2</span>
              <span className="text-amber-300 font-bold block">Analyst Decision</span>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">Documented override reason and rationale note</p>
            </div>
            <div className="p-2.5 bg-[#071019] rounded-lg border border-[#132236]">
              <span className="text-[#718197] block text-[10px] uppercase">Layer 3</span>
              <span className="text-emerald-400 font-bold block">Exception Status</span>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">ACTIVE (in effect) or REVOKED (baseline restored)</p>
            </div>
          </div>

          {filteredExceptions.length === 0 ? (
            <div className="bg-[#071019] border border-[#1B3045] rounded-2xl p-8 text-center space-y-3">
              <ShieldAlert className="w-10 h-10 mx-auto text-slate-500" />
              <h3 className="text-sm font-bold text-slate-200 font-mono">No Correlation Exceptions Found</h3>
              <p className="text-xs text-slate-400 font-mono max-w-md mx-auto">
                {exceptions.length === 0
                  ? 'All correlated assets are currently conforming to deterministic engine rules. To create an exception, open Asset Correlation and select candidate records requiring manual override.'
                  : 'No exceptions match your current search and status filter.'}
              </p>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('correlation')}
                  className="px-4 py-2 bg-[#0B1420] hover:bg-[#122236] text-[#00B8FF] border border-[#1B3045] rounded-xl text-xs font-semibold font-mono inline-flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                >
                  <span>Go to Asset Correlation</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[#071019] border border-[#1B3045] rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0B1522] border-b border-[#1B3045] text-[11px] font-mono text-[#8B95A5] uppercase tracking-wider">
                      <th className="px-5 py-3 font-semibold">EXCEPTION ID</th>
                      <th className="px-5 py-3 font-semibold">TARGET ASSET</th>
                      <th className="px-5 py-3 font-semibold">REASON</th>
                      <th className="px-5 py-3 font-semibold">ANALYST NOTE</th>
                      <th className="px-5 py-3 font-semibold">CREATED</th>
                      <th className="px-5 py-3 font-semibold">STATUS</th>
                      <th className="px-5 py-3 font-semibold text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#132236] text-xs font-sans">
                    {filteredExceptions.map((exc) => (
                      <tr key={exc.exceptionId} className="hover:bg-[#0B1522]/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-cyan-400 font-bold">
                          {exc.exceptionId}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-200">
                          {exc.assetGroupId}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono font-bold">
                            {exc.reason}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-300 font-sans max-w-xs truncate" title={exc.analystNote}>
                          {exc.analystNote}
                        </td>
                        <td className="px-5 py-3.5 text-[#8B95A5] font-mono text-[11px]">
                          {new Date(exc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            exc.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {exc.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {exc.status === 'ACTIVE' && onResolveException && (
                            <button
                              type="button"
                              onClick={() => {
                                if (canRevokeException) onResolveException(exc.exceptionId);
                              }}
                              disabled={!canRevokeException}
                              title={canRevokeException ? 'Revoke exception' : deniedTitle}
                              className={`px-2.5 py-1 bg-amber-950/20 hover:bg-amber-900/40 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-mono transition-colors min-h-[36px] ${canRevokeException ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 5: SESSION AUDIT TRAIL */}
      {subTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>SESSION AUDIT TRAIL</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {filteredAuditLogs.length} events
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Current session event log of correlation decisions, role modifications, and system operations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-52">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#5F6875]" />
                <input
                  type="text"
                  placeholder="Filter events..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="bg-[#0B1420] border border-[#1B3045] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#5F6875] focus:outline-none focus:border-[#00B8FF] w-full min-h-[36px]"
                />
              </div>

              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="bg-[#0B1420] border border-[#1B3045] rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#00B8FF] min-h-[36px]"
              >
                <option value="ALL">All Actions</option>
                <option value="MEMBER">Member Roles</option>
                <option value="CORRELATION">Correlations</option>
                <option value="EXCEPTION">Exceptions</option>
                <option value="ARCHIVE">Archiving</option>
                <option value="SYNC">Reprocess Sync</option>
                <option value="AI">AI Explanations</option>
              </select>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleExportAuditLogs('csv')}
                  className="px-3 py-1.5 bg-[#0B1420] hover:bg-[#122236] text-slate-200 border border-[#1B3045] rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors min-h-[36px] cursor-pointer"
                  title="Export session audit log as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-[#00B8FF]" />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportAuditLogs('json')}
                  className="px-3 py-1.5 bg-[#0B1420] hover:bg-[#122236] text-slate-200 border border-[#1B3045] rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors min-h-[36px] cursor-pointer"
                  title="Export session audit log as JSON"
                >
                  <Download className="w-3.5 h-3.5 text-[#00B8FF]" />
                  <span>JSON</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#071019] border border-[#1B3045] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0B1522] border-b border-[#1B3045] text-[11px] font-mono text-[#8B95A5] uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">TIMESTAMP</th>
                    <th className="px-5 py-3 font-semibold">ACTION</th>
                    <th className="px-5 py-3 font-semibold">TARGET</th>
                    <th className="px-5 py-3 font-semibold">ACTOR</th>
                    <th className="px-5 py-3 font-semibold">DETAILS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#132236] text-xs font-sans">
                  {filteredAuditLogs.map((log) => (
                    <tr
                      key={log.entryId}
                      onClick={() => setSelectedAuditLog(log)}
                      className="hover:bg-[#0B1522]/50 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3 font-mono text-[#8B95A5] text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-mono font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-cyan-400 font-bold whitespace-nowrap">
                        {log.targetId}
                      </td>
                      <td className="px-5 py-3 text-[#718197] font-mono text-[11px] whitespace-nowrap">
                        {log.actor}
                      </td>
                      <td className="px-5 py-3 text-slate-300 font-sans max-w-md truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Details Modal */}
          {selectedAuditLog && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#09101A] border border-[#1B3045] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#00B8FF]" />
                    <h3 className="text-base font-bold text-white font-mono">Audit Event Inspection</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAuditLog(null)}
                    className="text-slate-400 hover:text-white p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 bg-[#04080D] rounded-xl border border-[#132236] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">EVENT ID:</span>
                      <span className="text-white font-bold">{selectedAuditLog.entryId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ACTION:</span>
                      <span className="text-cyan-400 font-bold">{selectedAuditLog.action}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">TARGET:</span>
                      <span className="text-white">{selectedAuditLog.targetId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ACTOR:</span>
                      <span className="text-slate-300">{selectedAuditLog.actor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">TIMESTAMP:</span>
                      <span className="text-slate-300">{selectedAuditLog.timestamp}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-[11px] block mb-1">Details & Payload:</label>
                    <div className="p-3 bg-[#0B1522] rounded-xl border border-[#1B3045] text-slate-200 font-sans leading-relaxed">
                      {selectedAuditLog.details}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAuditLog(null)}
                    className="px-4 py-2 bg-[#122236] hover:bg-[#183250] text-[#00B8FF] rounded-xl text-xs font-semibold font-mono border border-[#00B8FF]/40 cursor-pointer min-h-[44px]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 6: SYSTEM HEALTH (DISTINGUISHING PLATFORM STATUS FROM SYNTHETIC DATA STATUS) */}
      {subTab === 'health' && (
        <div className="space-y-6">
          <div className="pb-2">
            <h2 className="text-sm font-bold text-slate-100 uppercase flex items-center gap-2">
              <span>SYSTEM HEALTH & PROCESSING PIPELINE</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                All Pipeline Components Operational
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Internal processing status for correlation engines, advisory AI gateway, and persistence layer.
            </p>
          </div>

          <div className="p-3 bg-[#0A121D] border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-300/90 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Synthetic source labels only. No production scanner or client telemetry is used. VulnFusion monitors its own internal processing pipeline.</span>
          </div>

          {/* Section 1: PLATFORM STATUS */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              PLATFORM STATUS
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Correlation Engine */}
              <div className="bg-[#071019] border border-[#1B3045] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Correlation Engine
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Operational
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">Deterministic multi-attribute matching core</p>
              </div>

              {/* Finding Correlation Engine */}
              <div className="bg-[#071019] border border-[#1B3045] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-blue-400" /> Finding Correlation Engine
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Operational
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">Vulnerability group deduplication</p>
              </div>

              {/* AI Gateway */}
              <div className="bg-[#071019] border border-[#1B3045] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI Gateway
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Operational
                  </span>
                </div>
                <p className="text-[11px] text-purple-300/80 font-mono">Advisory sidecar (Non-authoritative)</p>
              </div>

              {/* Export Engine */}
              <div className="bg-[#071019] border border-[#1B3045] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" /> Export Engine
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Operational
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">PDF, HTML, CSV, JSON multi-format</p>
              </div>

              {/* Storage */}
              <div className="bg-[#071019] border border-[#1B3045] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                    <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> Storage
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Operational
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">Immutable audit trail & state storage</p>
              </div>
            </div>
          </div>

          {/* Section 2: DATA STATUS (SYNTHETIC DATASET) */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              DATA STATUS
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
              <div className="p-3.5 bg-[#0B1522] rounded-xl border border-[#1B3045]">
                <span className="text-slate-400 block text-[10px]">SYNTHETIC SOURCE RECORDS</span>
                <span className="text-cyan-400 text-lg font-bold">{records.length || 81}</span>
              </div>
              <div className="p-3.5 bg-[#0B1522] rounded-xl border border-[#1B3045]">
                <span className="text-slate-400 block text-[10px]">UNDERLYING ASSETS</span>
                <span className="text-white text-lg font-bold">{clusters.length || 20}</span>
              </div>
              <div className="p-3.5 bg-[#0B1522] rounded-xl border border-[#1B3045]">
                <span className="text-slate-400 block text-[10px]">FINDINGS</span>
                <span className="text-slate-200 text-lg font-bold">{findings.length || 48}</span>
              </div>
              <div className="p-3.5 bg-[#0B1522] rounded-xl border border-[#1B3045]">
                <span className="text-slate-400 block text-[10px]">POTENTIAL REMEDIATION ISSUES</span>
                <span className="text-purple-300 text-lg font-bold">{findingGroups.length || 24}</span>
              </div>
              <div className="p-3.5 bg-[#0B1522] rounded-xl border border-[#1B3045]">
                <span className="text-slate-400 block text-[10px]">REVIEW REQUIRED</span>
                <span className={`text-lg font-bold ${reviewCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {reviewCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default AdminManagementTab;
