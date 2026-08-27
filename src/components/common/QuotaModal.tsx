import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Zap, Clock, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { OmniPlanId, stripeService } from '../../services/stripeService';

export function QuotaModal() {
  const { isQuotaModalOpen, closeQuotaModal, quotaModalReason, timeUntilReset, user } = useAuth();
  const { showToast } = useNotification();
  const [selectedPlan, setSelectedPlan] = useState<OmniPlanId>('single_use');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStripeLive, setIsStripeLive] = useState(false);

  useEffect(() => { stripeService.getStatus().then((status) => setIsStripeLive(status.configured)); }, [isQuotaModalOpen]);
  useEffect(() => {
    const reason = quotaModalReason.toLowerCase();
    if (reason.includes('10-credit')) setSelectedPlan('credits_10');
    else if (reason.includes('pro unlimited')) setSelectedPlan('pro');
    else setSelectedPlan('single_use');
  }, [quotaModalReason]);

  if (!isQuotaModalOpen) return null;

  const options: { id: OmniPlanId; name: string; price: string; detail: string; features: string[] }[] = [
    { id: 'single_use', name: 'Pay Once', price: '$1.49', detail: 'One premium job', features: ['1 premium use', 'Larger-file access', 'No subscription'] },
    { id: 'credits_10', name: '10 Credits', price: '$4.99', detail: 'Best for occasional repeat use', features: ['10 premium uses', 'Larger-file access', 'No subscription'] },
    { id: 'credits_30', name: '30 Credits', price: '$9.99', detail: 'More uses, still no subscription', features: ['30 premium uses', 'Larger-file access', 'No subscription'] },
    { id: 'pro', name: 'Pro Unlimited', price: '$9/mo', detail: 'For frequent use', features: ['Unlimited daily uses', 'Files up to 500 MB', 'All available tools'] },
  ];

  const handleCheckout = async () => {
    if (!isStripeLive) {
      showToast('info', 'Payments are not connected yet', 'Stripe checkout will be enabled after production payment setup is completed.');
      return;
    }
    setIsProcessing(true);
    try {
      const result = await stripeService.createCheckoutSession({ planId: selectedPlan, userEmail: user?.email });
      if (result.url) { window.location.href = result.url; return; }
      showToast('error', 'Checkout unavailable', result.error || 'Could not start secure checkout.');
    } catch {
      showToast('error', 'Checkout unavailable', 'Could not start secure checkout.');
    } finally { setIsProcessing(false); }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={closeQuotaModal} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-8 max-h-[90vh] overflow-y-auto">
          <button onClick={closeQuotaModal} className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"><X className="w-5 h-5" /></button>
          <div className="text-center max-w-2xl mx-auto mb-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3"><Zap className="w-3.5 h-3.5" /><span>{quotaModalReason}</span></div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">Choose the smallest option that fits your job.</h2>
            <p className="text-sm text-slate-400 mt-2">No forced subscription. Pay once, buy credits, or choose unlimited access.</p>
            <div className="inline-flex items-center gap-1.5 mt-3 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-lg"><Clock className="w-3.5 h-3.5" /><span>Your 3 free daily uses reset in <strong>{timeUntilReset || 'at midnight'}</strong>.</span></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
            {options.map((option) => (
              <button key={option.id} onClick={() => setSelectedPlan(option.id)} className={`text-left p-5 rounded-2xl border cursor-pointer transition-all ${selectedPlan === option.id ? 'bg-rose-950/30 border-rose-500 ring-1 ring-rose-500' : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'}`}>
                <p className="text-sm font-bold text-white">{option.name}</p>
                <p className="text-2xl font-extrabold text-white mt-2">{option.price}</p>
                <p className="text-[11px] text-slate-400 mt-1">{option.detail}</p>
                <ul className="mt-4 space-y-2 text-xs text-slate-300">{option.features.map((feature) => <li key={feature} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-rose-400 shrink-0" /><span>{feature}</span></li>)}</ul>
              </button>
            ))}
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300"><CreditCard className="w-4 h-4 text-indigo-400" /><span>Payments are processed securely by Stripe when connected.</span></div>
            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${isStripeLive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'}`}>{isStripeLive ? 'Checkout Ready' : 'Payment Setup Pending'}</span>
          </div>

          <button onClick={handleCheckout} disabled={isProcessing || !isStripeLive} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-heading font-bold cursor-pointer">
            {isProcessing ? 'Opening Secure Checkout…' : isStripeLive ? `Continue with ${options.find((o) => o.id === selectedPlan)?.name}` : 'Stripe Setup Pending'}
          </button>
          <p className="text-center text-[11px] text-slate-500 mt-3">Your files remain on your device during supported browser-based processing. Payment information is handled by Stripe.</p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
