import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Terminal,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface AdminLoginProps {
  onSuccess?: () => void;
  onBackToApp?: () => void;
}

export function AdminLogin({ onSuccess, onBackToApp }: AdminLoginProps) {
  const { adminLogin } = useAuth();
  const { showToast } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFillDemo = () => {
    setEmail('admin@omnypdf.com');
    setPassword('Admin@OmniPDF2026!');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Admin email address is required.');
      return;
    }

    if (!password) {
      setErrorMessage('Administrator password is required.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await adminLogin(email, password);
      if (res.success) {
        showToast('success', 'Admin Authenticated', 'Welcome back, System Administrator.');
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.error || 'Authentication failed. Unauthorized administrator.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Server error occurred during administrator authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg"
      >
        {/* Top Back Navigation */}
        {onBackToApp && (
          <div className="mb-4">
            <button
              onClick={onBackToApp}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to OmniPDF Workspace</span>
            </button>
          </div>
        )}

        <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-2xl p-8 sm:p-10 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-rose-500/20 border border-indigo-500/30 text-indigo-400 shadow-inner mb-4">
              <ShieldAlert className="w-8 h-8 text-indigo-400" />
            </div>

            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-indigo-400" />
                Restricted Area
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
              Executive Admin Console
            </h1>
            <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
              Administrative credentials required. Regular users and guest accounts cannot access system
              configurations or executive metrics.
            </p>
          </div>

          {/* Live Credentials Callout Box */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Login Credentials</span>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                Autofill Credentials
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Email</span>
                <span className="text-slate-200 select-all">admin@omnypdf.com</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Password</span>
                <span className="text-slate-200 select-all">Admin@OmniPDF2026!</span>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="admin-login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@omnypdf.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Master Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="admin-login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="admin-submit-login-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Master Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Enter Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Footnote */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>TLS 1.3 End-to-End Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span>Session Isolation Active</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
