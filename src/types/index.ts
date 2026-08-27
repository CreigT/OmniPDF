export type UserRole = 'free' | 'pro' | 'team' | 'enterprise' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  lastLogin: string;
  isSuspended?: boolean;
  subscription?: {
    planId: 'free' | 'pro_monthly' | 'pro_annual' | 'team_monthly' | 'enterprise';
    planName: string;
    status: 'active' | 'canceled' | 'past_due';
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    amount: number;
    billingInterval: 'month' | 'year';
    paymentMethod: {
      brand: 'visa' | 'mastercard' | 'amex';
      last4: string;
      expMonth: number;
      expYear: number;
    };
  };
  customDailyLimit?: number; // Override if admin sets custom
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  count: number;
  toolsUsed: Record<string, number>;
}

export type ToolId =
  | 'merge-pdf'
  | 'split-pdf'
  | 'compress-pdf'
  | 'pdf-to-image'
  | 'image-to-pdf'
  | 'pdf-to-word'
  | 'word-to-pdf'
  | 'image-converter'
  | 'print-pdf'
  | 'watermark-pdf'
  | 'protect-pdf'
  | 'rotate-pdf';

export interface ToolDefinition {
  id: ToolId;
  name: string;
  shortDesc: string;
  longDesc: string;
  category: 'core-pdf' | 'convert-from-pdf' | 'convert-to-pdf' | 'image-tools' | 'security-print';
  icon: string;
  badge?: 'Popular' | 'New' | 'Pro' | 'Fast';
  accept: string;
  multiple: boolean;
  actionText: string;
}

export interface ProcessingHistoryItem {
  id: string;
  userId: string;
  toolId: ToolId;
  toolName: string;
  timestamp: string;
  inputFiles: {
    name: string;
    size: number;
    type: string;
  }[];
  outputFile: {
    name: string;
    size: number;
    type: string;
    blobUrl?: string;
  };
  durationMs: number;
  savingsPercentage?: number;
  status: 'completed' | 'failed';
}

export interface InvoiceItem {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  date: string;
  status: 'paid' | 'refunded' | 'pending';
  planName: string;
  invoicePdfUrl?: string;
}

export interface SystemConfig {
  freeDailyLimit: number;
  maxFreeFileSizeMB: number;
  maxProFileSizeMB: number;
  maintenanceMode: boolean;
  announcementBanner: {
    enabled: boolean;
    message: string;
    type: 'info' | 'promo' | 'warning';
  };
  enableGuestProcessing: boolean;
  proMonthlyPrice: number;
  proAnnualPrice: number;
  enterpriseMonthlyPrice: number;
  enterpriseAnnualPrice: number;
  freeStorageMB: number;
  proStorageGB: number;
}

export interface PrintOptions {
  copies: number;
  layout: 'portrait' | 'landscape';
  colorMode: 'color' | 'grayscale';
  pages: 'all' | 'custom';
  customPages?: string;
  watermarkText?: string;
  includeHeaderFooter: boolean;
  fitToPage: boolean;
}
