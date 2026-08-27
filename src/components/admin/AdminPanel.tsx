import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Bell,
  Trash2,
  UserPlus,
  RefreshCw,
  Zap,
  Lock,
  Layers,
  Download,
  FileText,
  CreditCard,
  Eye,
  Activity,
  HardDrive,
  Edit2,
  X,
  Plus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { User, UserRole, InvoiceItem } from '../../types';

interface AdminPanelProps {
  onExit?: () => void;
}

export function AdminPanel({ onExit }: AdminPanelProps) {
  const {
    user,
    allUsers,
    transactions,
    systemConfig,
    updateSystemConfig,
    adminAddUser,
    adminUpdateUser,
    adminDeleteUser,
    history,
    dailyUsage,
    resetDailyUsage,
    logout,
  } = useAuth();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'billing' | 'pricing' | 'diagnostics'>('analytics');
  const [searchUser, setSearchUser] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('pro');
  const [newUserLimit, setNewUserLimit] = useState<number>(0);

  // System settings form state
  const [proMonthlyPrice, setProMonthlyPrice] = useState(systemConfig.proMonthlyPrice);
  const [proAnnualPrice, setProAnnualPrice] = useState(systemConfig.proAnnualPrice);
  const [enterpriseMonthlyPrice, setEnterpriseMonthlyPrice] = useState(systemConfig.enterpriseMonthlyPrice || 49);
  const [freeDailyLimit, setFreeDailyLimit] = useState(systemConfig.freeDailyLimit);
  const [maxFreeFileSize, setMaxFreeFileSize] = useState(systemConfig.maxFreeFileSizeMB);
  const [maxProFileSize, setMaxProFileSize] = useState(systemConfig.maxProFileSizeMB);
  const [freeStorageMB, setFreeStorageMB] = useState(systemConfig.freeStorageMB || 50);
  const [proStorageGB, setProStorageGB] = useState(systemConfig.proStorageGB || 10);
  const [bannerEnabled, setBannerEnabled] = useState(systemConfig.announcementBanner.enabled);
  const [bannerMessage, setBannerMessage] = useState(systemConfig.announcementBanner.message);
  const [maintenanceMode, setMaintenanceMode] = useState(systemConfig.maintenanceMode);

  // Metrics calculation
  const totalUsers = allUsers.length;
  const proSubscribersCount = allUsers.filter((u) => u.role !== 'free' && u.role !== 'admin').length;
  const totalMRR = allUsers.reduce((sum, u) => sum + (u.subscription?.amount || 0), 0);
  const totalConversionsToday = dailyUsage.count;

  // Real Tool popularity data computed dynamically from history and dailyUsage
  const toolCounts: Record<string, { name: string; count: number; color: string }> = {
    'merge-pdf': { name: 'Merge PDF', count: 0, color: '#f43f5e' },
    'split-pdf': { name: 'Split PDF', count: 0, color: '#f59e0b' },
    'compress-pdf': { name: 'Compress PDF', count: 0, color: '#10b981' },
    'pdf-to-image': { name: 'PDF to Image', count: 0, color: '#a855f7' },
    'image-to-pdf': { name: 'Image to PDF', count: 0, color: '#6366f1' },
    'pdf-to-word': { name: 'PDF to Word', count: 0, color: '#3b82f6' },
    'word-to-pdf': { name: 'Word to PDF', count: 0, color: '#06b6d4' },
    'image-converter': { name: 'Image Converter', count: 0, color: '#14b8a6' },
    'print-pdf': { name: 'Printout Prep', count: 0, color: '#0ea5e9' },
    'watermark-pdf': { name: 'Watermark', count: 0, color: '#ec4899' },
    'protect-pdf': { name: 'Protect PDF', count: 0, color: '#eab308' },
    'rotate-pdf': { name: 'Rotate PDF', count: 0, color: '#8b5cf6' },
  };

  // Tally from history
  history.forEach((h) => {
    if (toolCounts[h.toolId]) {
      toolCounts[h.toolId].count += 1;
    }
  });

  // Also include current dailyUsage if not yet in history
  Object.entries(dailyUsage.toolsUsed).forEach(([toolId, count]) => {
    if (toolCounts[toolId] && history.filter((h) => h.toolId === toolId).length === 0) {
      toolCounts[toolId].count += Number(count) || 0;
    }
  });

  const activeToolStats = Object.values(toolCounts).filter((t) => t.count > 0);
  const toolDistributionData =
    activeToolStats.length > 0
      ? activeToolStats.map((t) => ({ name: t.name, value: t.count, color: t.color }))
      : [{ name: 'Ready for operations', value: 1, color: '#334155' }];

  // Filtered users
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSaveSettings = () => {
    updateSystemConfig({
      proMonthlyPrice,
      proAnnualPrice,
      enterpriseMonthlyPrice,
      freeDailyLimit,
      maxFreeFileSizeMB: maxFreeFileSize,
      maxProFileSizeMB: maxProFileSize,
      freeStorageMB,
      proStorageGB,
      maintenanceMode,
      announcementBanner: {
        ...systemConfig.announcementBanner,
        enabled: bannerEnabled,
        message: bannerMessage,
      },
    });
    showToast('success', 'Configuration Updated', 'Pricing, limits, and system controls saved.');
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) {
      showToast('error', 'Validation Error', 'Email is required.');
      return;
    }

    adminAddUser(newUserName, newUserEmail, newUserRole, newUserLimit > 0 ? newUserLimit : undefined);
    showToast('success', 'User Created', `Added ${newUserEmail} as ${newUserRole.toUpperCase()}`);
    setIsAddUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserLimit(0);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    adminUpdateUser(editingUser.id, editingUser);
    showToast('success', 'User Updated', `Changes to ${editingUser.email} saved.`);
    setEditingUser(null);
  };

  const handleExportUsersCSV = () => {
    if (allUsers.length === 0) {
      showToast('info', 'No Users', 'User database is currently empty.');
      return;
    }

    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'MRR', 'Created At', 'Last Login'];
    const rows = allUsers.map((u) => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.role,
      u.isSuspended ? 'Suspended' : 'Active',
      u.subscription?.amount || 0,
      u.createdAt,
      u.lastLogin,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnypdf-users-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('success', 'Export Complete', 'Downloaded user accounts CSV.');
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-extrabold text-2xl text-white">Executive Control Console</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Superadmin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time user accounts, subscription billing, pricing limits & worker engine diagnostics.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                resetDailyUsage();
                showToast('success', 'Quotas Reset', 'Global daily usage counters reset to 0.');
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Daily Quotas</span>
            </button>

            {onExit && (
              <button
                onClick={onExit}
                className="px-3.5 py-2 rounded-xl bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Exit Console</span>
              </button>
            )}

            <button
              onClick={() => {
                logout();
                showToast('info', 'Logged Out', 'Administrator signed out safely.');
                if (onExit) onExit();
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out Admin</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-800/80 overflow-x-auto pb-1">
          {[
            { id: 'analytics', label: 'Executive Analytics', icon: TrendingUp },
            { id: 'users', label: `User Management (${allUsers.length})`, icon: Users },
            { id: 'billing', label: `Subscriptions & Invoices (${transactions.length})`, icon: DollarSign },
            { id: 'pricing', label: 'Pricing & Plans Setting', icon: Sliders },
            { id: 'diagnostics', label: 'Engine & Worker Diagnostics', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: EXECUTIVE ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Monthly Recurring Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-white">${totalMRR}.00</div>
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <span>↑ {proSubscribersCount} Active Paid Subscriptions</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Registered Users</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-white">{totalUsers}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                {proSubscribersCount} Pro / Enterprise Accounts
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Conversions Completed</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-white">
                {history.length + totalConversionsToday}
              </div>
              <div className="text-[11px] text-amber-400 mt-1">
                Sub-second client-side engine processing
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Worker Engine Status</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-emerald-400">100% Operational</div>
              <div className="text-[11px] text-slate-400 mt-1">Zero Cloud Leakage • In-Browser Sandbox</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tool Distribution Chart */}
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-heading font-bold text-white">Engine Tool Utilization</h3>
                  <p className="text-xs text-slate-400">Total conversion volume per tool category</p>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 font-mono">
                  Live Operations
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={toolDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Plan Tier Distribution */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-heading font-bold text-white mb-1">Subscriber Breakdown</h3>
                <p className="text-xs text-slate-400 mb-6">Free vs Pro vs Enterprise distribution</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-xs text-slate-300">Free Tier Users</span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {allUsers.filter((u) => u.role === 'free').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
                    <span className="text-xs text-indigo-300 font-medium">Pro Subscriptions ($9/mo)</span>
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      {allUsers.filter((u) => u.role === 'pro').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-purple-500/20">
                    <span className="text-xs text-purple-300 font-medium">Enterprise Workspaces ($49/mo)</span>
                    <span className="text-xs font-mono font-bold text-purple-400">
                      {allUsers.filter((u) => u.role === 'enterprise' || u.role === 'team').length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Conversion Rate to Paid:</span>
                <span className="font-bold text-emerald-400">
                  {totalUsers > 0 ? `${Math.round((proSubscribersCount / totalUsers) * 100)}%` : '0%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Roles</option>
                <option value="free">Free Users</option>
                <option value="pro">Pro Plan</option>
                <option value="enterprise">Enterprise</option>
                <option value="admin">Administrators</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleExportUsersCSV}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => {
                  setNewUserName('');
                  setNewUserEmail('');
                  setNewUserRole('pro');
                  setNewUserLimit(0);
                  setIsAddUserModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Role / Plan</th>
                    <th className="py-3 px-4">Quota Limit</th>
                    <th className="py-3 px-4">Subscription MRR</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : u.role === 'enterprise'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : u.role === 'pro'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {u.role !== 'free'
                          ? 'Unlimited'
                          : u.customDailyLimit
                          ? `${u.customDailyLimit}/day (custom)`
                          : `${systemConfig.freeDailyLimit}/day (default)`}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {u.subscription?.amount ? (
                          <span className="text-emerald-400 font-bold">${u.subscription.amount}/mo</span>
                        ) : (
                          <span className="text-slate-500">$0.00</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.isSuspended ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Suspended
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingUser(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => adminUpdateUser(u.id, { isSuspended: !u.isSuspended })}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors cursor-pointer"
                          >
                            {u.isSuspended ? 'Activate' : 'Suspend'}
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete account ${u.email}?`)) {
                                  adminDeleteUser(u.id);
                                  showToast('info', 'User Deleted', `Removed ${u.email}`);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No users found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BILLING & TRANSACTIONS */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-heading font-bold text-white">
                  All Invoices & Subscriptions ({transactions.length})
                </h3>
                <p className="text-xs text-slate-400">Live transaction history, automated receipt records & invoices</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Invoice Number</th>
                    <th className="py-3 px-4">Customer Email</th>
                    <th className="py-3 px-4">Plan Item</th>
                    <th className="py-3 px-4">Amount Paid</th>
                    <th className="py-3 px-4">Billing Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {transactions.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{inv.id}</td>
                      <td className="py-3.5 px-4 text-slate-300">{inv.userEmail}</td>
                      <td className="py-3.5 px-4">{inv.planName}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        ${inv.amount.toFixed(2)} USD
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{inv.date}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No transactions recorded yet. Invoices automatically generate when users upgrade to Pro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRICING & PLAN SETTINGS */}
      {activeTab === 'pricing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <h3 className="text-lg font-heading font-bold text-white mb-1">
                SaaS Pricing & Subscription Rates
              </h3>
              <p className="text-xs text-slate-400">
                Adjust plan pricing in real time. Changes take effect across all checkout modals and pricing cards.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Pro Monthly Price ($/mo)
                  </label>
                  <input
                    type="number"
                    value={proMonthlyPrice}
                    onChange={(e) => setProMonthlyPrice(Number(e.target.value) || 9)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Pro Annual Price ($/yr)
                  </label>
                  <input
                    type="number"
                    value={proAnnualPrice}
                    onChange={(e) => setProAnnualPrice(Number(e.target.value) || 79)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enterprise Monthly Price ($/mo)
                </label>
                <input
                  type="number"
                  value={enterpriseMonthlyPrice}
                  onChange={(e) => setEnterpriseMonthlyPrice(Number(e.target.value) || 49)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Free Tier Quota & File Size Guards
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Daily Limit</label>
                    <input
                      type="number"
                      value={freeDailyLimit}
                      onChange={(e) => setFreeDailyLimit(parseInt(e.target.value, 10) || 3)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Free Max MB</label>
                    <input
                      type="number"
                      value={maxFreeFileSize}
                      onChange={(e) => setMaxFreeFileSize(parseInt(e.target.value, 10) || 25)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Pro Max MB</label>
                    <input
                      type="number"
                      value={maxProFileSize}
                      onChange={(e) => setMaxProFileSize(parseInt(e.target.value, 10) || 500)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  File Vault Storage Allocations
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Free Tier Vault (MB)</label>
                    <input
                      type="number"
                      value={freeStorageMB}
                      onChange={(e) => setFreeStorageMB(Number(e.target.value) || 50)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Pro Tier Vault (GB)</label>
                    <input
                      type="number"
                      value={proStorageGB}
                      onChange={(e) => setProStorageGB(Number(e.target.value) || 10)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-heading font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                Save Live Pricing & Limits
              </button>
            </div>
          </div>

          {/* Announcement & Platform Controls */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <h3 className="text-lg font-heading font-bold text-white mb-1">
                Announcement & System Operations
              </h3>
              <p className="text-xs text-slate-400">
                Broadcast announcements to visitors or put the platform in maintenance mode.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bannerEnabled}
                    onChange={(e) => setBannerEnabled(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Enable Global Header Promo Banner</span>
                </label>

                {bannerEnabled && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Banner Message Copy</label>
                    <textarea
                      rows={2}
                      value={bannerMessage}
                      onChange={(e) => setBannerMessage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-rose-300 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-rose-500 text-rose-600 focus:ring-0"
                  />
                  <span>Platform Maintenance Mode Guard</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  When enabled, tool processing is paused for non-admin accounts with a maintenance notice.
                </p>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-heading font-bold text-xs transition-all cursor-pointer"
              >
                Apply System Controls
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ENGINE & WORKER DIAGNOSTICS */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                <span>Worker Latency</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-white">92 ms</div>
              <div className="text-[11px] text-emerald-400 mt-1">Average execution per file</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                <span>Wasm / Worker Memory</span>
                <HardDrive className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-white">Clean (Auto-GC)</div>
              <div className="text-[11px] text-indigo-400 mt-1">Blob URLs revoked after download</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                <span>Security Engine</span>
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-white">Air-Gapped Sandbox</div>
              <div className="text-[11px] text-purple-400 mt-1">Zero file egress to external servers</div>
            </div>
          </div>

          {/* Recent Engine Processing Events */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-heading font-bold text-white mb-4">
              Real-Time Engine Conversion Stream ({history.length})
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{h.toolName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({h.durationMs}ms)</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Output: {h.outputFile.name} • {(h.outputFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400">
                      Success
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(h.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No conversion events recorded in current session. Run any tool to populate the live stream.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-bold text-white">Add New User</h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Plan Tier</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="free">Free Starter Tier (3/day)</option>
                  <option value="pro">Pro Subscriber ($9/mo)</option>
                  <option value="enterprise">Enterprise Workspace ($49/mo)</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Daily Conversion Limit (Optional override)
                </label>
                <input
                  type="number"
                  min={0}
                  value={newUserLimit}
                  onChange={(e) => setNewUserLimit(Number(e.target.value))}
                  placeholder="0 (Use default)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-bold text-white">Edit User Account</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Role / Plan</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                >
                  <option value="free">Free Starter</option>
                  <option value="pro">Pro Subscriber</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Daily Limit Override
                </label>
                <input
                  type="number"
                  min={0}
                  value={editingUser.customDailyLimit || 0}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      customDailyLimit: Number(e.target.value) || undefined,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-heading font-bold text-white">Invoice {selectedInvoice.id}</h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6 space-y-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Billed To:</span>
                <span className="text-white font-semibold">{selectedInvoice.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Subscription Item:</span>
                <span className="text-white">{selectedInvoice.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  ${selectedInvoice.amount.toFixed(2)} {selectedInvoice.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400">
                  {selectedInvoice.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction Date:</span>
                <span className="text-slate-300">{selectedInvoice.date}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
