import { FileText, ShieldCheck, Zap, Lock, Sparkles, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ToolId } from '../../types';

interface FooterProps {
  onSelectTool: (toolId: ToolId) => void;
  onNavigate: (view: 'home' | 'tool' | 'dashboard' | 'admin' | 'pricing') => void;
}

export function Footer({ onSelectTool, onNavigate }: FooterProps) {
  const { user } = useAuth();
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-lg text-white tracking-tight">
                Omni<span className="text-rose-500">PDF</span> Pro
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The premier client-side PDF and Image SaaS suite. Process unlimited documents with
              enterprise-grade privacy, zero server storage, and sub-second conversion speeds.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Client-Side Sandbox</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-medium">
                <Zap className="w-3.5 h-3.5" />
                <span>Sub-second Processing</span>
              </div>
            </div>
          </div>

          {/* Core PDF Tools */}
          <div>
            <p className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">
              Core PDF Tools
            </p>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onSelectTool('merge-pdf')}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Merge PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('split-pdf')}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Split PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('compress-pdf')}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Compress PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('rotate-pdf')}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Rotate PDF
                </button>
              </li>
            </ul>
          </div>

          {/* Conversions */}
          <div>
            <p className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">
              Conversions
            </p>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onSelectTool('pdf-to-image')}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  PDF to Image
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('image-to-pdf')}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Image to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('pdf-to-word')}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  PDF to Word (DOCX)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('word-to-pdf')}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Word to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('image-converter')}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Image Format Converter
                </button>
              </li>
            </ul>
          </div>

          {/* Security & SaaS */}
          <div>
            <p className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">
              Security & Plans
            </p>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onSelectTool('print-pdf')}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Printout & Prep Tool
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('watermark-pdf')}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Watermark PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('protect-pdf')}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Protect PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('pricing')}
                  className="hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1 text-amber-400"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Pro Plans ($9/mo)</span>
                </button>
              </li>
              {user?.role === 'admin' ? (
                <li>
                  <button
                    onClick={() => onNavigate('admin')}
                    className="hover:text-indigo-400 transition-colors cursor-pointer text-indigo-400 flex items-center gap-1"
                  >
                    <Shield className="w-3 h-3" />
                    <span>Admin Control Panel</span>
                  </button>
                </li>
              ) : (
                <li>
                  <button
                    onClick={() => onNavigate('admin')}
                    className="text-slate-400 hover:text-slate-400 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                  >
                    <Lock className="w-2.5 h-2.5" />
                    <span>Staff Portal</span>
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} OmniPDF Pro SaaS Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational (99.99%)
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              256-Bit Encrypted Sandbox
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
