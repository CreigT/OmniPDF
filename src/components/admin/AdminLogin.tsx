import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim() || !password) {
      setErrorMessage('Email and password are required.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await adminLogin(email, password);
      if (res.success) {
        showToast('success', 'Signed in', 'Administrator access verified.');
        onSuccess?.();
      } else {
        setErrorMessage(res.error || 'Authentication failed.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to authenticate right now.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        {onBackToApp && (
          <button onClick={onBackToApp} className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /><span>Back to OmniPDF</span>
          </button>
        )}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 mb-4">
              <ShieldAlert className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">Administrator Sign In</h1>
            <p className="text-xs text-slate-400 mt-2">Authorized administrators only. Credentials are verified securely by the server.</p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-white outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-white outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer">
              {isLoading ? <span>Verifying…</span> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
