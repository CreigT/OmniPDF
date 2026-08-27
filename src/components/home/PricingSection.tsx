import { useState } from 'react';
import { Check, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function PricingSection() {
  const { openQuotaModal, user } = useAuth();
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simple, Transparent SaaS Pricing</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">
          Start Free. Upgrade for Unlimited Power.
        </h2>
        <p className="text-sm text-slate-400 mt-2">
          3 free daily conversions on any tool. No credit card required to get started.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={`text-xs font-medium ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6 rounded-full bg-slate-800 p-1 relative transition-colors focus:outline-none cursor-pointer"
          >
            <div
              className={`w-4 h-4 rounded-full bg-rose-500 transition-transform ${
                isAnnual ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-medium ${isAnnual ? 'text-white' : 'text-slate-400'}`}>
              Annual Billing
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Save 30%
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Free Tier */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-bold text-lg text-white">Free Starter</h3>
            <p className="text-xs text-slate-400 mt-1">For casual quick tasks</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">$0</span>
              <span className="text-xs text-slate-400">/forever</span>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span><strong>3 free conversions</strong> per day</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>25 MB max file size</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Merge, Split, Compress & Print</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>100% Client-side privacy</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => {}}
            className="w-full mt-8 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            {user?.role === 'free' ? 'Current Plan' : 'Free Forever'}
          </button>
        </div>

        {/* Pro Tier (Featured) */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950/20 border-2 border-rose-500 flex flex-col justify-between relative shadow-xl shadow-rose-500/10">
          <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
            Most Popular
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-white">Pro Unlimited</h3>
            <p className="text-xs text-slate-400 mt-1">For freelancers & creators</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">
                ${isAnnual ? '7.40' : '9.00'}
              </span>
              <span className="text-xs text-slate-400">/month</span>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span><strong>Unlimited</strong> daily conversions</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>500 MB max file upload size</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>PDF to Word (.docx) OCR</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Batch Image Format Converter</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Full Conversion History & Re-downloads</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => openQuotaModal('Upgrade to Pro Unlimited')}
            className="w-full mt-8 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-heading font-bold shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
          >
            {user?.role === 'pro' ? 'Manage Pro Plan' : 'Upgrade to Pro'}
          </button>
        </div>

        {/* Team Tier */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-bold text-lg text-white">Team Workspace</h3>
            <p className="text-xs text-slate-400 mt-1">For agency & small teams</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">
                ${isAnnual ? '15.80' : '19.00'}
              </span>
              <span className="text-xs text-slate-400">/month</span>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Up to 10 Team Seats</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>All Pro features included</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Shared team history & logs</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Centralized invoicing</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => openQuotaModal('Upgrade to Team Plan')}
            className="w-full mt-8 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Select Team Plan
          </button>
        </div>

        {/* Enterprise Tier */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-bold text-lg text-white">Enterprise</h3>
            <p className="text-xs text-slate-400 mt-1">For scale & compliance</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">
                ${isAnnual ? '39.00' : '49.00'}
              </span>
              <span className="text-xs text-slate-400">/month</span>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Unlimited team seats</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Developer REST API tokens</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Custom SLA & uptime guarantee</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>24/7 dedicated support</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => openQuotaModal('Enterprise Plan Setup')}
            className="w-full mt-8 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Contact Enterprise
          </button>
        </div>
      </div>
    </section>
  );
}
