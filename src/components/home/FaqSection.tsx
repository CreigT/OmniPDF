import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does the free 3 daily conversions limit work?',
      a: 'Every registered and guest user receives 3 free conversion credits per 24-hour day. Your quota automatically resets every night at midnight local time. If you need unlimited conversions or larger file limits, you can upgrade to Pro anytime.',
    },
    {
      q: 'Are my PDF documents safe and private?',
      a: 'Yes, 100%! OmniPDF processes documents entirely within your web browser sandbox using client-side WebAssembly and PDF-Lib. Your confidential PDFs, images, and text are never transmitted to or stored on external servers.',
    },
    {
      q: 'Can I print PDFs directly from the platform?',
      a: 'Yes! Our dedicated Printout & Prep Studio allows you to preview pages, select color or high-contrast grayscale, watermark, add page headers, and trigger high-resolution browser printing immediately.',
    },
    {
      q: 'What file formats can I convert between?',
      a: 'You can convert between PDF, Word (.docx), high-res PNG, JPG, WebP, SVG, and text files. We also support multi-image batch conversion into clean, paginated PDF documents.',
    },
    {
      q: 'Can I cancel my subscription anytime?',
      a: 'Absolutely. You can cancel with a single click inside your User Dashboard. You will retain unlimited Pro access until the end of your paid billing period.',
    },
  ];

  return (
    <section className="py-20 border-t border-slate-900 bg-slate-950/40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Everything you need to know about our daily limits, privacy, and tools.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-slate-900/80 border border-slate-800/80 overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-sm font-semibold text-white hover:text-rose-400 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    openIndex === idx ? 'rotate-180 text-rose-400' : ''
                  }`}
                />
              </button>

              {openIndex === idx && (
                <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
