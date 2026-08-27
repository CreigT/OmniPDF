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
    message: '🎉 Pro Launch: Get unlimited conversions with Pro access!',
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
  // Current user state - starts null if not logged in (Guest Mode)
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('omnypdf_current_user_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return null;
  });

  // All registered users database
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('omnypdf_all_users_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [];
  });

  // System config
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem('omnypdf_system_config_v3');
    if (saved) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      } catch {
        // fallback
      }
    }
    return DEFAULT_CONFIG;
  });

  // Daily usage
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>(() => {
    const today = getTodayString();
    const saved = localStorage.getItem(`omnypdf_usage_${today}_v3`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      date: today,
      count: 0,
      toolsUsed: {},
    };
  });

  // History state
  const [history, setHistory] = useState<ProcessingHistoryItem[]>(() => {
    const saved = localStorage.getItem('omnypdf_history_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [];
  });

  // Transactions state
  const [transactions, setTransactions] = useState<InvoiceItem[]>(() => {
    const saved = localStorage.getItem('omnypdf_transactions_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [];
  });

  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [quotaModalReason, setQuotaModalReason] = useState('Daily free limit reached');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Save changes to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('omnypdf_current_user_v3', JSON.stringify(user));
    } else {
      localStorage.removeItem('omnypdf_current_user_v3');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('omnypdf_all_users_v3', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('omnypdf_system_config_v3', JSON.stringify(systemConfig));
  }, [systemConfig]);

  useEffect(() => {
    const today = getTodayString();
    localStorage.setItem(`omnypdf_usage_${today}_v3`, JSON.stringify(dailyUsage));
  }, [dailyUsage]);

  useEffect(() => {
    localStorage.setItem('omnypdf_history_v3', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('omnypdf_transactions_v3', JSON.stringify(transactions));
  }, [transactions]);

  // Countdown timer for daily reset (midnight)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diffMs = tomorrow.getTime() - now.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeUntilReset(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  const openQuotaModal = (reason: string = 'You have reached the free conversion quota limit.') => {
    setQuotaModalReason(reason);
    setIsQuotaModalOpen(true);
  };

  const closeQuotaModal = () => {
    setIsQuotaModalOpen(false);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Check if current session can perform an action
  const canPerformAction = () => {
    const isProOrAdmin =
      user?.role === 'pro' ||
      user?.role === 'team' ||
      user?.role === 'enterprise' ||
      user?.role === 'admin';

    if (isProOrAdmin) {
      return {
        allowed: true,
        remaining: Infinity,
        limit: Infinity,
        isUnlimited: true,
      };
    }

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

    return {
      allowed: true,
      remaining,
      limit,
      isUnlimited: false,
    };
  };

  // Record a completed tool action
  const recordUsage = (
    toolId: ToolId,
    toolName: string,
    inputFiles: File[],
    outputFile: { name: string; size: number; type: string; blobUrl?: string },
    durationMs: number,
    savingsPercentage?: number
  ) => {
    const today = getTodayString();
    const isPro = user?.role !== 'free' && user?.role !== undefined;

    // Increment count
    setDailyUsage((prev) => {
      const newCount = isPro ? prev.count : prev.count + 1;
      const currentToolCount = prev.toolsUsed[toolId] || 0;
      return {
        date: today,
        count: newCount,
        toolsUsed: {
          ...prev.toolsUsed,
          [toolId]: currentToolCount + 1,
        },
      };
    });

    // Add to history
    const historyItem: ProcessingHistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user?.id || 'guest',
      toolId,
      toolName,
      timestamp: new Date().toISOString(),
      inputFiles: inputFiles.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
      outputFile,
      durationMs,
      savingsPercentage,
      status: 'completed',
    };

    setHistory((prev) => [historyItem, ...prev]);
  };

  // Upgrade subscription flow
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
      planName = 'OmniPDF Team Workspace';
      role = 'team';
    } else if (planId === 'enterprise') {
      amount = systemConfig.enterpriseMonthlyPrice || 49;
      planName = 'OmniPDF Enterprise Suite';
      role = 'enterprise';
    }

    const expiryDate = new Date();
    if (billingInterval === 'year') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    const targetUser = user || {
      id: `usr_${Date.now()}`,
      name: 'Valued Subscriber',
      email: 'subscriber@omnypdf.com',
      role: 'free' as UserRole,
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
        paymentMethod: {
          brand: paymentDetails.brand,
          last4: paymentDetails.last4,
          expMonth: 12,
          expYear: 2029,
        },
      },
    };

    setUser(updatedUser);
    setAllUsers((prev) => {
      const exists = prev.some((u) => u.id === updatedUser.id);
      if (exists) {
        return prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      }
      return [...prev, updatedUser];
    });

    // Create Real Invoice
    const invoiceId = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInvoice: InvoiceItem = {
      id: invoiceId,
      userId: updatedUser.id,
      userEmail: updatedUser.email,
      amount,
      currency: 'USD',
      date: getTodayString(),
      status: 'paid',
      planName,
    };

    setTransactions((prev) => [newInvoice, ...prev]);

    // Close paywall modal
    setIsQuotaModalOpen(false);

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    return true;
  };

  const cancelSubscription = () => {
    if (!user || !user.subscription) return;
    const updatedUser: User = {
      ...user,
      subscription: {
        ...user.subscription,
        cancelAtPeriodEnd: true,
      },
    };
    setUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const login = (role: UserRole = 'free', email?: string, name?: string) => {
    const userEmail = email?.trim() || 'user@example.com';
    const userName = name?.trim() || 'User Account';
    const existing = allUsers.find((u) => u.email.toLowerCase() === userEmail.toLowerCase());
    if (existing) {
      const updated = { ...existing, lastLogin: new Date().toISOString() };
      setUser(updated);
      setAllUsers((prev) => prev.map((u) => (u.id === existing.id ? updated : u)));
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

  const signup = (name: string, email: string) => {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim() || 'New User';
    const existing = allUsers.find((u) => u.email.toLowerCase() === trimmedEmail.toLowerCase());
    if (existing) {
      setUser(existing);
      return;
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      role: 'free',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    setUser(newUser);
    setAllUsers((prev) => [...prev, newUser]);
  };

  const updateUserProfile = (updates: { name?: string; email?: string }) => {
    if (!user) return;
    const updated: User = {
      ...user,
      name: updates.name?.trim() || user.name,
      email: updates.email?.trim() || user.email,
    };
    setUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
  };

  const adminLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulated network verification delay for live auth experience
    await new Promise((resolve) => setTimeout(resolve, 600));

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    // Valid admin credentials check
    const isValidEmail =
      normalizedEmail === 'admin@omnypdf.com' ||
      normalizedEmail === 'admin@omnypdf.io' ||
      normalizedEmail === 'admin@platform.io' ||
      normalizedEmail === 'admin@saas.com' ||
      normalizedEmail === 'admin@system.internal' ||
      normalizedEmail === 'admin@example.com';

    const isValidPassword =
      normalizedPassword === 'Admin@OmniPDF2026!' ||
      normalizedPassword === 'AdminMaster2026!' ||
      normalizedPassword === 'admin123';

    if (!isValidEmail) {
      return { success: false, error: 'Unauthorized email address. Administrator privilege required.' };
    }

    if (!isValidPassword) {
      return { success: false, error: 'Invalid master administrator password.' };
    }

    // Authenticated admin user
    const adminUser: User = {
      id: 'usr_superadmin',
      name: 'System Administrator',
      email: normalizedEmail,
      role: 'admin',
      createdAt: '2025-01-01T00:00:00Z',
      lastLogin: new Date().toISOString(),
    };

    setUser(adminUser);
    setAllUsers((prev) => {
      const exists = prev.some((u) => u.email.toLowerCase() === adminUser.email.toLowerCase());
      if (exists) {
        return prev.map((u) =>
          u.email.toLowerCase() === adminUser.email.toLowerCase()
            ? { ...u, role: 'admin', lastLogin: new Date().toISOString() }
            : u
        );
      }
      return [...prev, adminUser];
    });

    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  const resetDailyUsage = () => {
    setDailyUsage({
      date: getTodayString(),
      count: 0,
      toolsUsed: {},
    });
  };

  const updateSystemConfig = (newConfig: Partial<SystemConfig>) => {
    setSystemConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const adminAddUser = (name: string, email: string, role: UserRole, customDailyLimit?: number): User => {
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim() || 'New User',
      email: email.trim().toLowerCase(),
      role,
      customDailyLimit: customDailyLimit && customDailyLimit > 0 ? customDailyLimit : undefined,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      subscription:
        role === 'pro' || role === 'enterprise'
          ? {
              planId: role === 'pro' ? 'pro_monthly' : 'enterprise',
              planName: role === 'pro' ? 'OmniPDF Pro Monthly' : 'OmniPDF Enterprise Suite',
              status: 'active',
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
              cancelAtPeriodEnd: false,
              amount: role === 'pro' ? systemConfig.proMonthlyPrice : systemConfig.enterpriseMonthlyPrice,
              billingInterval: 'month',
              paymentMethod: {
                brand: 'visa',
                last4: '9999',
                expMonth: 12,
                expYear: 2029,
              },
            }
          : undefined,
    };

    setAllUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const adminUpdateUser = (userId: string, updates: Partial<User>) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const merged = { ...u, ...updates };
          if (user?.id === userId) setUser(merged);
          return merged;
        }
        return u;
      })
    );
  };

  const adminDeleteUser = (userId: string) => {
    setAllUsers((prev) => prev.filter((u) => u.id !== userId));
    if (user?.id === userId) {
      setUser(null);
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        dailyUsage,
        systemConfig,
        history,
        allUsers,
        transactions,
        isQuotaModalOpen,
        quotaModalReason,
        isAuthModalOpen,
        canPerformAction,
        recordUsage,
        upgradeSubscription,
        cancelSubscription,
        login,
        signup,
        updateUserProfile,
        adminLogin,
        logout,
        openQuotaModal,
        closeQuotaModal,
        openAuthModal,
        closeAuthModal,
        resetDailyUsage,
        updateSystemConfig,
        adminAddUser,
        adminUpdateUser,
        adminDeleteUser,
        clearHistory,
        timeUntilReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
