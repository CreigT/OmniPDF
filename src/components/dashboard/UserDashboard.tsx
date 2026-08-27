import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Clock,
  HardDrive,
  FileText,
  Sparkles,
  Download,
  Printer,
  Trash2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  TrendingUp,
  Search,
  FolderLock,
  Star,
  Eye,
  User as UserIcon,
  Save,
  Check,
  FileImage,
  FileArchive,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { ToolId, ProcessingHistoryItem } from '../../types';
import { generateInvoicePDF } from '../../services/pdfEngine';
import { PrintModal } from '../common/PrintModal';
import { storageVault, StoredFile } from '../../services/storageService';
import { stripeService } from '../../services/stripeService';

interface UserDashboardProps {
  onSelectTool: (toolId: ToolId) => void;
  onNavigateToPricing: () => void;
}

export function UserDashboard({ onSelectTool, onNavigateToPricing }: UserDashboardProps) {
  const {
    user,
    dailyUsage,
    systemConfig,
    history,
    transactions,
    clearHistory,
    openQuotaModal,
    cancelSubscription,
    timeUntilReset,
    updateUserProfile,
  } = useAuth();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'overview' | 'vault' | 'history' | 'billing' | 'profile'>('overview');
  const [searchHistory, setSearchHistory] = useState('');
  const [selectedToolFilter, setSelectedToolFilter] = useState<string>('all');

  // Vault state
  const [vaultFiles, setVaultFiles] = useState<StoredFile[]>([]);
  const [vaultSearch, setVaultSearch] = useState('');
  const [vaultCategory, setVaultCategory] = useState<string>('all');
  const [isLoadingVault, setIsLoadingVault] = useState(false);

  // Profile edit state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Print modal trigger from history
  const [selectedHistoryItemForPrint, setSelectedHistoryItemForPrint] =
    useState<ProcessingHistoryItem | null>(null);

  const isUnlimited = user?.role && user.role !== 'free';
  const limit = user?.customDailyLimit ?? systemConfig.freeDailyLimit;
  const remaining = Math.max(0, limit - dailyUsage.count);

  // Load storage vault files
  const loadVaultFiles = async () => {
    setIsLoadingVault(true);
    try {
      const files = await storageVault.getAllFiles();
      setVaultFiles(files);
    } catch {
      // fallback
    } finally {
      setIsLoadingVault(false);
    }
  };

  useEffect(() => {
    loadVaultFiles();
  }, [history.length]);

  // Sync profile fields when user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
    }
  }, [user]);

  // Filter history
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.toolName.toLowerCase().includes(searchHistory.toLowerCase()) ||
      item.outputFile.name.toLowerCase().includes(searchHistory.toLowerCase()) ||
      item.inputFiles.some((f) => f.name.toLowerCase().includes(searchHistory.toLowerCase()));
    const matchesTool = selectedToolFilter === 'all' || item.toolId === selectedToolFilter;
    return matchesSearch && matchesTool;
  });

  // Filter vault files
  const filteredVaultFiles = vaultFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(vaultSearch.toLowerCase());
    const matchesCat = vaultCategory === 'all' || file.category === vaultCategory;
    return matchesSearch && matchesCat;
  });

  // Vault Storage Math
  const totalVaultBytes = vaultFiles.reduce((sum, f) => sum + f.size, 0);
  const totalVaultMB = (totalVaultBytes / (1024 * 1024)).toFixed(2);
  const maxStorageMB = isUnlimited ? (systemConfig.proStorageGB || 10) * 1024 : (systemConfig.freeStorageMB || 50);
  const storagePercentage = Math.min(100, Math.round((Number(totalVaultMB) / maxStorageMB) * 100));

  // Calculate usage stats
  const totalFilesConverted = history.length;
  const totalVolumeMB = (
    history.reduce((acc, item) => acc + item.inputFiles.reduce((sub, f) => sub + f.size, 0), 0) /
    (1024 * 1024)
  ).toFixed(1);

  // Dynamic chart data for last 7 days
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const usageChartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - i));
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLabel = i === 6 ? `${daysOfWeek[d.getDay()]} (Today)` : daysOfWeek[d.getDay()];

    const countForDay =
      i === 6
        ? dailyUsage.count
        : history.filter((item) => item.timestamp.startsWith(dayKey)).length;

    return {
      day: dayLabel,
      conversions: countForDay,
    };
  });

  const handleDownloadInvoice = async (invoice: (typeof transactions)[0]) => {
    try {
      const blob = await generateInvoicePDF(invoice);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoice.id}.pdf`;
      a.click();
      showToast('success', 'Invoice Downloaded', `Downloaded receipt for ${invoice.id}`);
    } catch {
      showToast('error', 'Error', 'Could not generate invoice PDF.');
    }
  };

  const handleReDownload = (item: ProcessingHistoryItem) => {
    if (item.outputFile.blobUrl) {
      const a = document.createElement('a');
      a.href = item.outputFile.blobUrl;
      a.download = item.outputFile.name;
      a.click();
      showToast('success', 'File Downloaded', item.outputFile.name);
    } else {
      showToast('info', 'File Saved', 'Downloaded output.');
    }
  };

  const handleDeleteVaultFile = async (id: string, name: string) => {
    await storageVault.deleteFile(id);
    showToast('info', 'File Deleted', `Removed ${name} from storage vault.`);
    loadVaultFiles();
  };

  const handleToggleStar = async (id: string) => {
    await storageVault.toggleStar(id);
    loadVaultFiles();
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    updateUserProfile({ name: profileName, email: profileEmail });
    setTimeout(() => {
      setIsSavingProfile(false);
      showToast('success', 'Profile Updated', 'Account details have been saved.');
    }, 400);
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Banner: User Greeting & Quota Status */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-indigo-600 flex items-center justify-center font-heading font-extrabold text-white text-xl shadow-lg shadow-rose-500/20">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                  {user?.name || 'Workspace Account'}
                </h1>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    user?.role === 'free' || !user?.role
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : user?.role === 'admin'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}
                >
                  {user?.role ? `${user.role} plan` : 'Free Starter'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{user?.email || 'Guest Session • Open Account'}</p>
            </div>
          </div>

          {/* Right Quota Action Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Daily Conversion Quota
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                {isUnlimited ? (
                  <span className="text-lg font-bold text-indigo-400">Unlimited Conversions</span>
                ) : (
                  <>
                    <span className="text-xl font-heading font-extrabold text-white">{remaining}</span>
                    <span className="text-xs text-slate-400">/ {limit} left today</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                <span>Resets in {timeUntilReset}</span>
              </p>
            </div>

            {!isUnlimited ? (
              <button
                id="dashboard-upgrade-btn"
                onClick={() => openQuotaModal('Upgrade to Pro Unlimited')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-heading font-bold shadow-lg shadow-rose-500/20 transition-all cursor-pointer whitespace-nowrap"
              >
                Upgrade to Pro
              </button>
            ) : (
              <button
                onClick={onNavigateToPricing}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Plan Settings
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-8 overflow-x-auto">
        {[
          { id: 'overview', label: 'Analytics & Overview', icon: TrendingUp },
          { id: 'vault', label: `Document Vault (${vaultFiles.length})`, icon: FolderLock },
          { id: 'history', label: `Conversion History (${history.length})`, icon: Clock },
          { id: 'billing', label: 'Subscription & Invoices', icon: CreditCard },
          { id: 'profile', label: 'Account Profile', icon: UserIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Operations
                </span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-heading font-extrabold text-white">
                {totalFilesConverted}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Processed in browser engine</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Storage Vault Used
                </span>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <HardDrive className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-heading font-extrabold text-white">{totalVaultMB} MB</p>
              <p className="text-[11px] text-slate-500 mt-1">of {maxStorageMB} MB capacity ({storagePercentage}%)</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Today&apos;s Usage
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-heading font-extrabold text-white">
                {dailyUsage.count}{' '}
                <span className="text-xs font-normal text-slate-400">
                  {isUnlimited ? '(Unlimited)' : `/ ${limit}`}
                </span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Daily quota limit</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Security Sandbox
                </span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-heading font-extrabold text-emerald-400">100%</p>
              <p className="text-[11px] text-slate-500 mt-1">Zero server data leakage</p>
            </div>
          </div>

          {/* Usage Chart */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-base font-heading font-bold text-white mb-1">
              Weekly Conversion Activity
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Number of documents processed across all tools
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usageChartData}>
                  <defs>
                    <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="conversions"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#usageGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENT VAULT & STORAGE */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          {/* Storage Meter Header */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-heading font-bold text-white flex items-center gap-2">
                  <FolderLock className="w-5 h-5 text-indigo-400" />
                  <span>In-Browser Document Storage Vault</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Saved files and converted documents safely cached in your private browser sandbox.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-white">{totalVaultMB} MB</span>
                <span className="text-xs text-slate-400"> / {maxStorageMB} MB used</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  storagePercentage > 85 ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-rose-500'
                }`}
                style={{ width: `${Math.max(2, storagePercentage)}%` }}
              />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={vaultSearch}
                onChange={(e) => setVaultSearch(e.target.value)}
                placeholder="Search saved files..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {['all', 'pdf', 'image', 'archive'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setVaultCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                    vaultCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}

              {vaultFiles.length > 0 && (
                <button
                  onClick={async () => {
                    if (confirm('Clear all files in your local storage vault?')) {
                      await storageVault.clearAll();
                      showToast('info', 'Vault Cleared', 'All local cached documents removed.');
                      loadVaultFiles();
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Vault</span>
                </button>
              )}
            </div>
          </div>

          {/* Vault Files Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Document Name</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Size</th>
                    <th className="py-3.5 px-4">Tool Origin</th>
                    <th className="py-3.5 px-4">Saved At</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredVaultFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleToggleStar(file.id)}
                            className="text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                file.starred ? 'text-amber-400 fill-amber-400' : ''
                              }`}
                            />
                          </button>
                          <span className="font-mono text-white font-medium truncate max-w-xs block">
                            {file.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                          {file.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {(file.size / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{file.toolUsed || 'OmniPDF'}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => storageVault.downloadFile(file)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white cursor-pointer"
                            title="Download File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVaultFile(file.id, file.name)}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 cursor-pointer"
                            title="Delete File"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredVaultFiles.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No files in storage vault yet. When you run any tool, use &quot;Save to Vault&quot; to keep it forever.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECENT CONVERSION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                placeholder="Search history by filename..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearHistory}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Tool</th>
                    <th className="py-3.5 px-4">Output Document</th>
                    <th className="py-3.5 px-4">Input Files</th>
                    <th className="py-3.5 px-4">Size / Savings</th>
                    <th className="py-3.5 px-4">Time</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white">{item.toolName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-200 font-medium truncate max-w-xs block">
                          {item.outputFile.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {item.inputFiles.map((f) => f.name).join(', ')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-medium">
                          {(item.outputFile.size / 1024).toFixed(1)} KB
                        </span>
                        {item.savingsPercentage && (
                          <span className="ml-2 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            -{item.savingsPercentage}%
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReDownload(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white cursor-pointer"
                            title="Re-download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedHistoryItemForPrint(item)}
                            className="p-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/60 text-sky-400 hover:text-sky-300 cursor-pointer"
                            title="Print Document"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No processing history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUBSCRIPTION & BILLING */}
      {activeTab === 'billing' && (
        <div className="space-y-8">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-heading font-bold text-white">
                    {user?.subscription?.planName || 'Free Starter Plan'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {user?.subscription
                    ? `$${user.subscription.amount}/${user.subscription.billingInterval} • Current billing period ends ${new Date(
                        user.subscription.currentPeriodEnd
                      ).toLocaleDateString()}`
                    : '3 free conversions per day • 25MB maximum upload'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {!isUnlimited ? (
                  <button
                    onClick={() => openQuotaModal('Upgrade to Pro')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-heading font-bold shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
                  >
                    Upgrade Plan
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        showToast('info', 'Connecting...', 'Opening Stripe Customer Billing Portal.');
                        const portalUrl = await stripeService.openCustomerPortal(user?.id || 'cust_demo');
                        if (portalUrl) {
                          window.location.href = portalUrl;
                        } else {
                          showToast('info', 'Self-Service Billing', 'Subscription is actively managed through your account.');
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Stripe Portal</span>
                    </button>
                    <button
                      onClick={cancelSubscription}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancel Subscription
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase flex items-center gap-2">
                    <span>{user?.subscription?.paymentMethod ? `${user.subscription.paymentMethod.brand} ending in ${user.subscription.paymentMethod.last4}` : 'Stripe SaaS Billing Gateway'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {user?.subscription?.paymentMethod ? `Expires ${user.subscription.paymentMethod.expMonth}/${user.subscription.paymentMethod.expYear}` : 'Secure PCI DSS Level 1 Certified Payments'}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Stripe Gateway Connected</span>
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden p-6 shadow-xl">
            <h3 className="text-base font-heading font-bold text-white mb-4">
              Billing History & Receipts
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">PDF Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {transactions
                    .filter((inv) => inv.userId === user?.id || user?.role === 'admin')
                    .map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-white">{inv.id}</td>
                        <td className="py-3.5 px-4 text-slate-400">{inv.date}</td>
                        <td className="py-3.5 px-4">{inv.planName}</td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          ${inv.amount.toFixed(2)} USD
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDownloadInvoice(inv)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}

                  {transactions.filter((inv) => inv.userId === user?.id || user?.role === 'admin').length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No billing history or receipts generated yet. Upgrade to Pro to generate invoices.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ACCOUNT PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-xl bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <h3 className="text-lg font-heading font-bold text-white mb-1">
            Account Profile & Identity
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Update your account name and email address.
          </p>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-heading font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isSavingProfile ? (
                  <span>Saving Changes...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile Information</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Print modal popup if triggered from history */}
      {selectedHistoryItemForPrint && (
        <PrintModal
          isOpen={!!selectedHistoryItemForPrint}
          onClose={() => setSelectedHistoryItemForPrint(null)}
          file={
            new File(
              [],
              selectedHistoryItemForPrint.outputFile.name,
              { type: 'application/pdf' }
            )
          }
          blobUrl={selectedHistoryItemForPrint.outputFile.blobUrl}
          pageCount={3}
        />
      )}
    </div>
  );
}
