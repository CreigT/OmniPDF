import { Shield, Zap, Lock, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: <Lock className="w-5 h-5 text-rose-400" />,
      title: 'Zero Data Leaks',
      desc: 'All file parsing, page manipulation, and conversions execute inside your browser sandbox. Documents never touch cloud servers.',
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      title: 'Sub-Second Speeds',
      desc: 'Optimized WebAssembly & vector processing engines handle multi-page documents instantly without network upload queues.',
    },
    {
      icon: <Cpu className="w-5 h-5 text-indigo-400" />,
      title: 'Lossless Precision',
      desc: 'Retain crisp typography, vector diagrams, hyperlinks, and document metadata across all merge, split, and conversion steps.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      title: 'OCR & Format Suite',
      desc: 'Effortlessly transform between PDF, editable Word (.docx), high-res JPG/PNG/WebP, and customizable print sheets.',
    },
  ];

  return (
    <section className="py-20 border-t border-slate-900 bg-slate-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
            Why Professionals Choose OmniPDF Pro
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Built for security-minded enterprises, designers, developers, and daily power users.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all shadow-md"
            >
              <div className="p-3 rounded-xl bg-slate-800/80 w-fit mb-4">{feat.icon}</div>
              <h3 className="text-base font-heading font-bold text-white mb-2">{feat.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
