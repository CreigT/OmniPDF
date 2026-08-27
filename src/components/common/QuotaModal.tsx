import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Tag,
  Clock,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { stripeService } from '../../services/stripeService';

export function QuotaModal() {
  const { isQuotaModalOpen, closeQuotaModal, quotaModalReason, upgradeSubscription, timeUntilReset, user } =
    useAuth();
  const { showToast } = useNotification();

  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year');
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'team' | 'enterprise'>('pro');
  const [couponCode, setCouponCode] = useState('LAUNCH50');
  const [discountApplied, setDiscountApplied] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStripeLive, setIsStripeLive] = useState(false);

  useEffect(() => {
    stripeService.getStatus().then((status) => {
      setIsStripeLive(status.configured);
    });
  }, []);

  if (!isQuotaModalOpen) return null;

  const applyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'LAUNCH50' || couponCode.trim().toUpperCase() === 'PRO50') {
      setDiscountApplied(true);
      showToast('success', 'Coupon Applied!', '50% discount applied to your checkout.');
    } else {
      setDiscountApplied(false);
      showToast('error', 'Invalid Coupon', 'Please check your code or try LAUNCH50.');
    }
  };

  const getPrice = (plan: 'pro' | 'team' | 'enterprise') => {
    let base = plan === 'pro' ? 9 : plan === 'team' ? 19 : 49;
    if (billingInterval === 'year') {
      base = plan === 'pro' ? 7.4 : plan === 'team' ? 15.8 : 39.0;
    }
    if (discountApplied) {
      base = base * 0.5;
    }
    return base.toFixed(2);
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const planId =
        selectedPlan === 'pro'
          ? billingInterval === 'year'
            ? 'pro_annual'
            : 'pro'
          : selectedPlan === 'team'
          ? 'team'
          : 'enterprise';

      // 1. Check if backend Stripe Checkout is active
      const sessionResult = await stripeService.createCheckoutSession({
        planId,
        billingInterval,
        userEmail: user?.email,
        discountCode: discountApplied ? couponCode : undefined,
      });

      if (sessionResult.url) {
        showToast('info', 'Redirecting to Stripe...', 'Opening secure Stripe Checkout gateway.');
        window.location.href = sessionResult.url;
        return;
      }

      // 2. Fallback to instant sandbox activation if no Stripe key is configured
      await new Promise((r) => setTimeout(r, 600));
      const subPlanId =
        selectedPlan === 'pro'
          ? billingInterval === 'year'
            ? 'pro_annual'
            : 'pro_monthly'
          : selectedPlan === 'team'
          ? 'team_monthly'
          : 'enterprise';
      await upgradeSubscription(subPlanId, { brand: 'visa', last4: '4242' });
      showToast('success', 'Subscription Activated!', `Welcome to OmniPDF ${selectedPlan.toUpperCase()}! You now have unlimited daily conversions.`);
    } catch {
      showToast('error', 'Payment Error', 'Could not complete transaction.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={closeQuotaModal}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            id="close-quota-modal-btn"
            onClick={closeQuotaModal}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center max-w-lg mx-auto mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5 fill-rose-400" />
              <span>{quotaModalReason}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
              Unlock Unlimited PDF Processing
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Free accounts are limited to 3 actions per day. Upgrade to Pro for high-speed unlimited
              conversions, 500MB batch processing, and OCR extraction.
            </p>

            {/* Reset countdown reminder */}
            <div className="inline-flex items-center gap-1.5 mt-3 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
              <span>Free daily quota resets in: <strong>{timeUntilReset || 'midnight'}</strong></span>
            </div>
          </div>

          {/* Billing Cycle Switch */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className={`text-xs font-medium ${billingInterval === 'month' ? 'text-white' : 'text-slate-400'}`}>
              Monthly Billing
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
              className="w-12 h-6 rounded-full bg-slate-800 p-1 relative transition-colors focus:outline-none cursor-pointer"
            >
              <div
                className={`w-4 h-4 rounded-full bg-rose-500 transition-transform ${
                  billingInterval === 'year' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-medium ${billingInterval === 'year' ? 'text-white' : 'text-slate-400'}`}>
                Annual (Save 30%)
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                2 Mo Free
              </span>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Pro Plan */}
            <div
              onClick={() => setSelectedPlan('pro')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all relative ${
                selectedPlan === 'pro'
                  ? 'bg-rose-950/30 border-rose-500 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500'
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <p className="text-sm font-bold text-white">Pro Unlimited</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">${getPrice('pro')}</span>
                <span className="text-xs text-slate-400">/mo</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">For power users & freelancers</p>

              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Unlimited daily conversions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>500 MB max file size</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>PDF to Word (DOCX)</span>
                </li>
              </ul>
            </div>

            {/* Team Plan */}
            <div
              onClick={() => setSelectedPlan('team')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all relative ${
                selectedPlan === 'team'
                  ? 'bg-indigo-950/30 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <p className="text-sm font-bold text-white">Team Workspace</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">${getPrice('team')}</span>
                <span className="text-xs text-slate-400">/mo</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Up to 10 team seats</p>

              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Shared document history</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Centralized team billing</span>
                </li>
              </ul>
            </div>

            {/* Enterprise Plan */}
            <div
              onClick={() => setSelectedPlan('enterprise')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all relative ${
                selectedPlan === 'enterprise'
                  ? 'bg-purple-950/30 border-purple-500 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500'
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <p className="text-sm font-bold text-white">Enterprise Suite</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">${getPrice('enterprise')}</span>
                <span className="text-xs text-slate-400">/mo</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Unlimited organization</p>

              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Dedicated API keys</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>SSO & custom SLA</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Priority 24/7 support</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Coupon & Payment simulation */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between mb-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Tag className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-semibold text-slate-200">Promo Code:</span>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="LAUNCH50"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white uppercase tracking-wider focus:outline-none focus:border-rose-500 font-mono w-28"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {discountApplied && (
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>50% Launch Discount Activated!</span>
                </div>
              )}
            </div>

            {/* Payment security info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Payment Processing Engine
                </label>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200">
                  <CreditCard className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-slate-200">Stripe Billing Platform</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${isStripeLive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                      {isStripeLive ? 'Live Checkout' : 'Sandbox Ready'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Security & Terms
                </label>
                <p className="text-xs text-slate-400 pt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>256-bit Encrypted • Cancel anytime with 1-click</span>
                </p>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              id="cancel-quota-modal-btn"
              onClick={closeQuotaModal}
              className="text-xs text-slate-400 hover:text-white transition-colors order-2 sm:order-1 cursor-pointer"
            >
              Continue with Free Limit (3/day)
            </button>

            <button
              id="confirm-upgrade-btn"
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-heading font-bold text-sm shadow-xl shadow-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 order-1 sm:order-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Connecting Stripe...</span>
                </>
              ) : (
                <>
                  <span>Upgrade to {selectedPlan.toUpperCase()} — ${getPrice(selectedPlan)}/mo</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
