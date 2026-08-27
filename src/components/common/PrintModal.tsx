import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Printer,
  FileText,
  Sliders,
  Check,
  Download,
  Stamp,
  Copy,
} from 'lucide-react';
import { PrintOptions } from '../../types';
import { useNotification } from '../../context/NotificationContext';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  blobUrl?: string;
  pageCount?: number;
}

export function PrintModal({ isOpen, onClose, file, blobUrl, pageCount = 3 }: PrintModalProps) {
  const { showToast } = useNotification();

  const [options, setOptions] = useState<PrintOptions>({
    copies: 1,
    layout: 'portrait',
    colorMode: 'color',
    pages: 'all',
    customPages: '1-3',
    watermarkText: '',
    includeHeaderFooter: true,
    fitToPage: true,
  });

  const [previewPage, setPreviewPage] = useState(1);

  if (!isOpen || !file) return null;

  const handlePrint = () => {
    showToast('info', 'Opening Print Dialog', 'Preparing high-resolution print stream...');

    // If blobUrl is available, open print frame or trigger browser print
    const printWindow = window.open(blobUrl || '', '_blank');
    if (printWindow) {
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
        } catch {
          // fallback
          window.print();
        }
      }, 500);
    } else {
      window.print();
    }
  };

  const handleDownload = () => {
    if (blobUrl) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `print-ready-${file.name}`;
      a.click();
      showToast('success', 'Download Started', 'Print-ready PDF saved.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-10 my-8 overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-white">
                  PDF Print & Output Studio
                </h3>
                <p className="text-xs text-slate-400">
                  {file.name} • {pageCount} pages • {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: Split 2 columns (Preview vs Controls) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
            {/* Left: Live Visual Print Sheet Preview */}
            <div className="lg:col-span-7 p-6 bg-slate-950/60 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800 min-h-[360px]">
              <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
                <span>Page</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(pageCount, 5) }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPreviewPage(idx + 1)}
                      className={`w-6 h-6 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        previewPage === idx + 1
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <span>of {pageCount}</span>
              </div>

              {/* Sheet preview container */}
              <div
                className={`relative bg-white rounded-lg shadow-2xl text-slate-900 p-8 transition-all overflow-hidden flex flex-col justify-between ${
                  options.layout === 'landscape'
                    ? 'w-full max-w-[420px] aspect-[1.414/1]'
                    : 'w-full max-w-[320px] aspect-[1/1.414]'
                } ${options.colorMode === 'grayscale' ? 'grayscale contrast-125' : ''}`}
              >
                {/* Watermark overlay if set */}
                {options.watermarkText && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                    <span className="text-3xl font-extrabold text-rose-500/20 transform -rotate-45 uppercase tracking-widest border-4 border-rose-500/20 px-6 py-2 rounded-xl">
                      {options.watermarkText}
                    </span>
                  </div>
                )}

                {/* Print Sheet Header */}
                {options.includeHeaderFooter && (
                  <div className="border-b border-slate-200 pb-2 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                    <span className="truncate max-w-[180px]">{file.name}</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                )}

                {/* Sheet Sample Content */}
                <div className="my-auto space-y-2 py-4">
                  <div className="h-4 w-3/4 bg-slate-800 rounded font-bold" />
                  <div className="h-2.5 w-full bg-slate-300 rounded" />
                  <div className="h-2.5 w-5/6 bg-slate-200 rounded" />
                  <div className="h-2.5 w-4/6 bg-slate-200 rounded" />

                  <div className="p-3 bg-slate-100 rounded border border-slate-200 mt-4 space-y-1.5">
                    <div className="h-2 w-1/2 bg-sky-600 rounded" />
                    <div className="h-2 w-full bg-slate-300 rounded" />
                    <div className="h-2 w-3/4 bg-slate-300 rounded" />
                  </div>
                </div>

                {/* Print Sheet Footer */}
                {options.includeHeaderFooter && (
                  <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                    <span>Printed via OmniPDF Pro</span>
                    <span>Page {previewPage} of {pageCount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Print Configuration Panel */}
            <div className="lg:col-span-5 p-6 space-y-5 bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span>Print Settings</span>
              </div>

              {/* Number of copies */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Number of Copies
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                    <button
                      onClick={() => setOptions((prev) => ({ ...prev, copies: Math.max(1, prev.copies - 1) }))}
                      className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-white font-mono">
                      {options.copies}
                    </span>
                    <button
                      onClick={() => setOptions((prev) => ({ ...prev, copies: Math.min(20, prev.copies + 1) }))}
                      className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-slate-400">
                    Total output: {options.copies * pageCount} pages
                  </span>
                </div>
              </div>

              {/* Orientation */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Orientation Layout
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOptions((prev) => ({ ...prev, layout: 'portrait' }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      options.layout === 'portrait'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Portrait</span>
                  </button>
                  <button
                    onClick={() => setOptions((prev) => ({ ...prev, layout: 'landscape' }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      options.layout === 'landscape'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 rotate-90" />
                    <span>Landscape</span>
                  </button>
                </div>
              </div>

              {/* Color Mode */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Color Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOptions((prev) => ({ ...prev, colorMode: 'color' }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      options.colorMode === 'color'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-rose-400 to-indigo-400" />
                    <span>Full Color</span>
                  </button>
                  <button
                    onClick={() => setOptions((prev) => ({ ...prev, colorMode: 'grayscale' }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      options.colorMode === 'grayscale'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span>Grayscale</span>
                  </button>
                </div>
              </div>

              {/* Watermark text */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Print Watermark (Optional)
                </label>
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
                  <Stamp className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={options.watermarkText || ''}
                    onChange={(e) => setOptions((prev) => ({ ...prev, watermarkText: e.target.value }))}
                    placeholder="e.g. CONFIDENTIAL or DRAFT"
                    className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full uppercase"
                  />
                  {options.watermarkText && (
                    <button
                      onClick={() => setOptions((prev) => ({ ...prev, watermarkText: '' }))}
                      className="text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeHeaderFooter}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, includeHeaderFooter: e.target.checked }))
                    }
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
                  />
                  <span>Include Header, Footer & Page Numbers</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.fitToPage}
                    onChange={(e) => setOptions((prev) => ({ ...prev, fitToPage: e.target.checked }))}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
                  />
                  <span>Auto-scale to printable margin boundary</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleDownload}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF File</span>
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="execute-browser-print-btn"
                onClick={handlePrint}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-heading font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document Now</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
