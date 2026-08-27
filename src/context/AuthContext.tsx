import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  UserRole,
  DailyUsage,
  ProcessingHistoryItem,
  InvoiceItem,
  SystemConfig,
  ToolId,
} from '../types';

interface AuthContextType {
  user: User | null;
  dailyUsage: DailyUsage;
  systemConfig: SystemConfig;
  history: ProcessingHistoryItem[];
  allUsers: User[];
  transactions: InvoiceItem[];
  isQuotaModalOpen: boolean;
  quotaModalReason: string;
  isAuthModalOpen: boolean;
  canPerformAction: () => {
    allowed: boolean;
    remaining: number;
    limit: number;
    isUnlimited: boolean;
    reason?: string;
  };
  recordUsage: (
    toolId: ToolId,
    toolName: string,
    inputFiles: File[],
    outputFile: { name: string; size: number; type: string; blobUrl?: string },
    durationMs: number,
    savingsPercentage?: number
  ) => void;
  upgradeSubscription: (
    planId: 'pro_monthly' | 'pro_annual' | 'team_monthly' | 'enterprise',
    paymentDetails?: { brand: 'visa' | 'mastercard' | 'amex'; last4: string }
  ) => Promise<boolean>;
  cancelSubscription: () => void;
  login: (role: UserRole, email?: string, name?: string) => void;
  signup: (name: string, email: string) => void;
  updateUserProfile: (updates: { name?: string; email?: string }) => void;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  openQuotaModal: (reason?: string) => void;
  closeQuotaModal: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  resetDailyUsage: (userId?: string) => void;
  updateSystemConfig: (newConfig: Partial<SystemConfig>) => void;
  adminAddUser: (name: string, email: string, role: UserRole, customDailyLimit?: number) => User;
  adminUpdateUser: (userId: string, updates: Partial<User>) => void;
  adminDeleteUser: (userId: string) => void;
  clearHistory: () => void;
  timeUntilReset: string;
}

const DEFAULT_CONFIG: SystemConfig = {
  freeDailyLimit: 3,
  maxFreeFileSizeMB: 25,
  maxProFileSizeMB: 500,
  maintenanceMode: false,
  announcementBanner: {
    enabled: true,
    message: 'Get unlimited daily uses and larger file support with Pro.',
    type: 'promo',
  },
  enableGuestProcessing: true,
  proMonthlyPrice: 9,
  proAnnualPrice: 79,
  enterpriseMonthlyPrice: 49,
  enterpriseAnnualPrice: 399,
  freeStorageMB: 50,
  proStorageGB: 10,
};

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('omnypdf_current_user_v3');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved) as User;
      // Admin authorization is server-owned; never trust a persisted browser admin role.
      if (parsed.role === 'admin') return null;
      return parsed;
    } catch {
      return null;
    }
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('omnypdf_all_users_v3');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved) as User[];
      return parsed.filter((u) => u.role !== 'admin');
    } catch {
      return [];
    }
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem('omnypdf_system_config_v3');
    if (!saved) return DEFAULT_CONFIG;
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [dailyUsage, setDailyUsage] = useState<DailyUsage>(() => {
    const today = getTodayString();
    const saved = localStorage.getItem(`omnypdf_usage_${today}_v3`);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return { date: today, count: 0, toolsUsed: {} };
  });

  const [history, setHistory] = useState<ProcessingHistoryItem[]>(() => {
    const saved = localStorage.getItem('omnypdf_history_v3');
    if (!saved) return [];
    try { return JSON.parse(saved); } catch { return []; }
  });

  const [transactions, setTransactions] = useState<InvoiceItem[]>(() => {
    const saved = localStorage.getItem('omnypdf_transactions_v3');
    if (!saved) return [];
    try { return JSON.parse(saved); } catch { return []; }
  });

  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [quotaModalReason, setQuotaModalReason] = useState('Daily free limit reached');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') localStorage.setItem('omnypdf_current_user_v3', JSON.stringify(user));
    else localStorage.removeItem('omnypdf_current_user_v3');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('omnypdf_all_users_v3', JSON.stringify(allUsers.filter((u) => u.role !== 'admin')));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('omnypdf_system_config_v3', JSON.stringify(systemConfig));
  }, [systemConfig]);

  useEffect(() => {
    localStorage.setItem(`omnypdf_usage_${getTodayString()}_v3`, JSON.stringify(dailyUsage));
  }, [dailyUsage]);

  useEffect(() => {
    localStorage.setItem('omnypdf_history_v3', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('omnypdf_transactions_v3', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diffMs = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      setTimeUntilReset(`${hours}h ${minutes}m`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  const openQuotaModal = (reason = 'You have reached the free conversion quota limit.') => {
    setQuotaModalReason(reason);
    setIsQuotaModalOpen(true);
  };
  const closeQuotaModal = () => setIsQuotaModalOpen(false);
  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const canPerformAction = () => {
    const isUnlimited = ['pro', 'team', 'enterprise', 'admin'].includes(user?.role || '');
    if (isUnlimited) return { allowed: true, remaining: Infinity, limit: Infinity, isUnlimited: true };
    const limit = user?.customDailyLimit ?? systemConfig.freeDailyLimit;
    const remaining = Math.max(0, limit - dailyUsage.count);
    if (remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        limit,
        isUnlimited: false,
        reason: `Daily quota limit of ${limit} free conversions reached. Upgrade to Pro for unlimited conversions.`,
      };
    }
    return { allowed: true, remaining, limit, isUnlimited: false };
  };

  const recordUsage = (
    toolId: ToolId,
    toolName: string,
    inputFiles: File[],
    outputFile: { name: string; size: number; type: string; blobUrl?: string },
    durationMs: number,
    savingsPercentage?: number
  ) => {
    const today = getTodayString();
    const isPaid = user?.role !== 'free' && user?.role !== undefined;
    setDailyUsage((prev) => ({
      date: today,
      count: isPaid ? prev.count : prev.count + 1,
      toolsUsed: { ...prev.toolsUsed, [toolId]: (prev.toolsUsed[toolId] || 0) + 1 },
    }));

    const historyItem: ProcessingHistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user?.id || 'guest',
      toolId,
      toolName,
      timestamp: new Date().toISOString(),
      inputFiles: inputFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      outputFile,
      durationMs,
      savingsPercentage,
      status: 'completed',
    };
    setHistory((prev) => [historyItem, ...prev]);
  };

  const upgradeSubscription = async (
    planId: 'pro_monthly' | 'pro_annual' | 'team_monthly' | 'enterprise',
    paymentDetails = { brand: 'visa' as const, last4: '4242' }
  ) => {
    let amount = systemConfig.proMonthlyPrice;
    let planName = 'OmniPDF Pro Monthly';
    let billingInterval: 'month' | 'year' = 'month';
    let role: UserRole = 'pro';
    if (planId === 'pro_annual') {
      amount = systemConfig.proAnnualPrice;
      planName = 'OmniPDF Pro Annual';
      billingInterval = 'year';
    } else if (planId === 'team_monthly') {
      amount = 19;
      planName = 'OmniPDF Team';
      role = 'team';
    } else if (planId === 'enterprise') {
      amount = systemConfig.enterpriseMonthlyPrice || 49;
      planName = 'OmniPDF Enterprise';
      role = 'enterprise';
    }
    const expiryDate = new Date();
    if (billingInterval === 'year') expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    else expiryDate.setMonth(expiryDate.getMonth() + 1);

    const targetUser: User = user || {
      id: `usr_${Date.now()}`,
      name: 'Subscriber',
      email: 'subscriber@omnypdf.com',
      role: 'free',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    const updatedUser: User = {
      ...targetUser,
      role,
      subscription: {
        planId,
        planName,
        status: 'active',
        currentPeriodEnd: expiryDate.toISOString(),
        cancelAtPeriodEnd: false,
        amount,
        billingInterval,
        paymentMethod: { brand: paymentDetails.brand, last4: paymentDetails.last4, expMonth: 12, expYear: 2029 },
      },
    };
    setUser(updatedUser);
    setAllUsers((prev) => prev.some((u) => u.id === updatedUser.id)
      ? prev.map((u) => u.id === updatedUser.id ? updatedUser : u)
      : [...prev, updatedUser]);

    const invoice: InvoiceItem = {
      id: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: updatedUser.id,
      userEmail: updatedUser.email,
      amount,
      currency: 'USD',
      date: getTodayString(),
      status: 'paid',
      planName,
    };
    setTransactions((prev) => [invoice, ...prev]);
    setIsQuotaModalOpen(false);
    try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch { /* ignore */ }
    return true;
  };

  const cancelSubscription = () => {
    if (!user?.subscription) return;
    const updated = { ...user, subscription: { ...user.subscription, cancelAtPeriodEnd: true } };
    setUser(updated);
    setAllUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
  };

  const login = (role: UserRole = 'free', email?: string, name?: string) => {
    const userEmail = email?.trim() || 'user@example.com';
    const userName = name?.trim() || 'User Account';
    const existing = allUsers.find((u) => u.email.toLowerCase() === userEmail.toLowerCase());
    if (existing) {
      const updated = { ...existing, lastLogin: new Date().toISOString() };
      setUser(updated);
      setAllUsers((prev) => prev.map((u) => u.id === existing.id ? updated : u));
      return;
    }
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: userName,
      email: userEmail,
      role,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    setUser(newUser);
    setAllUsers((prev) => [...prev, newUser]);
  };

  const signup = (name: string, email: string) => login('free', email, name);

  const updateUserProfile = (updates: { name?: string; email?: string }) => {
    if (!user || user.role === 'admin') return;
    const updated = { ...user, name: updates.name?.trim() || user.name, email: updates.email?.trim() || user.email };
    setUser(updated);
    setAllUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
  };

  const adminLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Administrator authentication failed.' };
      }
      // Browser receives no credential secret and no reusable auth token; the server keeps auth in HttpOnly cookie.
      setUser({
        id: 'server_admin',
        name: 'Administrator',
        email: email.trim().toLowerCase(),
        role: 'admin',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });
      return { success: true };
    } catch {
      return { success: false, error: 'Unable to reach the secure administrator authentication service.' };
    }
  };

  const logout = () => {
    if (user?.role === 'admin') {
      fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
    }
    setUser(null);
  };

  const resetDailyUsage = () => setDailyUsage({ date: getTodayString(), count: 0, toolsUsed: {} });
  const updateSystemConfig = (newConfig: Partial<SystemConfig>) => setSystemConfig((prev) => ({ ...prev, ...newConfig }));

  const adminAddUser = (name: string, email: string, role: UserRole, customDailyLimit?: number): User => {
    const safeRole: UserRole = role === 'admin' ? 'free' : role;
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || 'New User',
      email: email.trim().toLowerCase(),
      role: safeRole,
      customDailyLimit: customDailyLimit && customDailyLimit > 0 ? customDailyLimit : undefined,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    setAllUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const adminUpdateUser = (userId: string, updates: Partial<User>) => {
    const safeUpdates = updates.role === 'admin' ? { ...updates, role: 'free' as UserRole } : updates;
    setAllUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...safeUpdates } : u));
  };

  const adminDeleteUser = (userId: string) => setAllUsers((prev) => prev.filter((u) => u.id !== userId));
  const clearHistory = () => setHistory([]);

  return (
    <AuthContext.Provider value={{
      user, dailyUsage, systemConfig, history, allUsers, transactions,
      isQuotaModalOpen, quotaModalReason, isAuthModalOpen,
      canPerformAction, recordUsage, upgradeSubscription, cancelSubscription,
      login, signup, updateUserProfile, adminLogin, logout,
      openQuotaModal, closeQuotaModal, openAuthModal, closeAuthModal,
      resetDailyUsage, updateSystemConfig, adminAddUser, adminUpdateUser,
      adminDeleteUser, clearHistory, timeUntilReset,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
