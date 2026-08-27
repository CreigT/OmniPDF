import { Check, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function PricingSection() {
  const { openQuotaModal, user } = useAuth();

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      subtitle: 'For occasional PDF tasks',
      features: ['3 uses per day', 'Files up to 25 MB', 'Core PDF and image tools', 'Browser-based processing'],
      cta: user?.role === 'free' ? 'Current Plan' : 'Free Access',
      featured: false,
      reason: '',
    },
    {
      name: 'Pay Once',
      price: '$1.49',
      subtitle: 'For one premium or larger job',
      features: ['1 premium use', 'Larger file support', 'No subscription', 'Use it only when needed'],
      cta: 'Pay for One Use',
      featured: false,
      reason: 'Pay once for one premium use',
    },
    {
      name: 'Credit Pack',
      price: '$4.99',
      subtitle: 'For several jobs without a subscription',
      features: ['10 premium uses', 'Larger file support', 'Credits do not require a subscription', 'Use credits when you need them'],
      cta: 'Buy 10 Credits',
      featured: false,
      reason: 'Buy a 10-credit pack',
    },
    {
      name: 'Pro Unlimited',
      price: '$9/mo',
      subtitle: 'For frequent and larger-file workflows',
      features: ['Unlimited daily uses', 'Files up to 500 MB', 'All currently available tools', 'Batch workflows as they are added'],
      cta: user?.role === 'pro' ? 'Manage Pro Plan' : 'Go Pro Unlimited',
      featured: true,
      reason: 'Upgrade to Pro Unlimited',
    },
  ];

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" /><span>Simple Pricing</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white tracking-tight">Free when you can. Pay only when you need more.</h2>
        <p className="text-sm text-slate-400 mt-2">Start with 3 free uses per day, pay for a single job, buy a small credit pack, or choose Pro Unlimited.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {tiers.map((tier) => (
          <div key={tier.name} className={`p-7 rounded-3xl flex flex-col justify-between relative ${tier.featured ? 'bg-gradient-to-b from-slate-900 to-rose-950/20 border-2 border-rose-500 shadow-xl shadow-rose-500/10' : 'bg-slate-900/60 border border-slate-800'}`}>
            {tier.featured && <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider">Best for heavy use</div>}
            <div>
              <h3 className="font-heading font-bold text-xl text-white">{tier.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{tier.subtitle}</p>
              <div className="mt-4"><span className="text-3xl font-extrabold text-white">{tier.price}</span></div>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                {tier.features.map((feature) => <li key={feature} className="flex items-center gap-2"><Check className={`w-4 h-4 ${tier.featured ? 'text-rose-400' : 'text-slate-400'}`} /><span>{feature}</span></li>)}
              </ul>
            </div>
            {tier.reason ? (
              <button onClick={() => openQuotaModal(tier.reason)} className={`w-full mt-8 py-3 rounded-xl text-xs font-heading font-bold cursor-pointer ${tier.featured ? 'bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}>{tier.cta}</button>
            ) : (
              <div className="w-full mt-8 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold text-center">{tier.cta}</div>
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-slate-500 mt-6">No forced subscription. Choose the smallest option that fits the job.</p>
    </section>
  );
}
