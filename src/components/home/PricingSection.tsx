import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function PricingSection() {
  const { openQuotaModal, user } = useAuth();
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" /><span>Simple Pricing</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">Start Free. Upgrade When You Need More.</h2>
        <p className="text-sm text-slate-400 mt-2">Use the core tools free up to 3 times per day. Pro removes the daily-use limit and supports larger files.</p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={`text-xs font-medium ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
          <button onClick={() => setIsAnnual(!isAnnual)} className="w-12 h-6 rounded-full bg-slate-800 p-1 relative cursor-pointer">
            <div className={`w-4 h-4 rounded-full bg-rose-500 transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
          <span className={`text-xs font-medium ${isAnnual ? 'text-white' : 'text-slate-400'}`}>Annual</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <div className="p-7 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-bold text-xl text-white">Free</h3>
            <p className="text-xs text-slate-400 mt-1">For occasional PDF tasks</p>
            <div className="mt-4"><span className="text-3xl font-extrabold text-white">$0</span></div>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-400" /><span>3 uses per day</span></li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-400" /><span>Files up to 25 MB</span></li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-400" /><span>Core PDF and image tools</span></li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-400" /><span>Browser-based file processing</span></li>
            </ul>
          </div>
          <div className="w-full mt-8 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold text-center">{user?.role === 'free' ? 'Current Plan' : 'Free Access'}</div>
        </div>

        <div className="p-7 rounded-3xl bg-gradient-to-b from-slate-900 to-rose-950/20 border-2 border-rose-500 flex flex-col justify-between relative shadow-xl shadow-rose-500/10">
          <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider">Most Popular</div>
          <div>
            <h3 className="font-heading font-bold text-xl text-white">Pro</h3>
            <p className="text-xs text-slate-400 mt-1">For frequent and larger-file workflows</p>
            <div className="mt-4 flex items-baseline gap-1"><span className="text-3xl font-extrabold text-white">${isAnnual ? '6.58' : '9.00'}</span><span className="text-xs text-slate-400">/month</span></div>
            {isAnnual && <p className="text-[11px] text-slate-500 mt-1">$79 billed annually</p>}
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-rose-400" /><span><strong>Unlimited daily uses</strong></span></li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-rose-400" /><span>Files up to 500 MB</span></li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-rose-400" /><span>All currently available PDF and image tools</span></li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-rose-400" /><span>Conversion history where supported</span></li>
            </ul>
          </div>
          <button onClick={() => openQuotaModal('Upgrade to Pro')} className="w-full mt-8 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-heading font-bold cursor-pointer">{user?.role === 'pro' ? 'Manage Pro Plan' : 'Upgrade to Pro'}</button>
        </div>
      </div>
      <p className="text-center text-xs text-slate-500 mt-6">OCR quality varies by document and is not advertised as a Pro benefit at this time.</p>
    </section>
  );
}
