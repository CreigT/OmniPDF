import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Printer,
  Layers,
  Scissors,
  Minimize2,
  Image as ImageIcon,
  FileSpreadsheet,
  Stamp,
} from 'lucide-react';
import { ToolId } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface HeroSectionProps {
  onSelectToolWithFiles: (toolId: ToolId, files: File[]) => void;
  onSelectTool: (toolId: ToolId) => void;
}

export function HeroSection({ onSelectToolWithFiles, onSelectTool }: HeroSectionProps) {
  const { user, dailyUsage, systemConfig } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isUnlimited = user?.role && user.role !== 'free';
  const limit = user?.customDailyLimit ?? systemConfig.freeDailyLimit;
  const remaining = Math.max(0, limit - dailyUsage.count);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const firstFile = files[0];
    const isPDF = firstFile.type === 'application/pdf' || firstFile.name.endsWith('.pdf');
    const isImg = firstFile.type.startsWith('image/');

    if (files.length > 1 && isPDF) onSelectToolWithFiles('merge-pdf', files);
    else if (files.length > 1 && isImg) onSelectToolWithFiles('image-to-pdf', files);
    else if (isPDF) onSelectToolWithFiles('compress-pdf', files);
    else if (isImg) onSelectToolWithFiles('image-to-pdf', files);
    else onSelectToolWithFiles('word-to-pdf', files);
  };

  const quickTools: { id: ToolId; label: string; icon: React.ElementType }[] = [
    { id: 'merge-pdf', label: 'Merge PDF', icon: Layers },
    { id: 'split-pdf', label: 'Split PDF', icon: Scissors },
    { id: 'compress-pdf', label: 'Compress PDF', icon: Minimize2 },
    { id: 'pdf-to-image', label: 'PDF to Image', icon: ImageIcon },
    { id: 'pdf-to-word', label: 'PDF to Word', icon: FileSpreadsheet },
    { id: 'watermark-pdf', label: 'Watermark PDF', icon: Stamp },
    { id: 'print-pdf', label: 'Print & Prepare', icon: Printer },
  ];

  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-900">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-rose-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[300px] bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 mb-6 shadow-md backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <strong className="text-white">Files never leave your browser.</strong>
            <span className="text-slate-600">•</span>
            {isUnlimited ? (
              <span className="text-indigo-400 font-bold">Unlimited access active</span>
            ) : (
              <span className="text-rose-400"><strong>{remaining} of {limit}</strong> free uses left today</span>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-white tracking-tight leading-[1.1]">
            Your PDF & Image Tools <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-rose-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              All in One Place.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Merge, split, compress, convert, watermark, and print PDFs directly in your browser. Your files stay on your device, with 3 free daily uses and no added watermarks.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-3xl p-8 sm:p-10 border-2 border-dashed transition-all cursor-pointer text-center group ${
              isDragging ? 'border-rose-500 bg-rose-950/20 scale-[1.01]' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
            }`}
          >
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt" className="hidden" onChange={handleFileInput} />
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-indigo-500/20 border border-rose-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="text-lg font-heading font-bold text-white mb-1">Drop your PDF or image files here</h3>
            <p className="text-xs text-slate-400 mb-5">Supports PDF, PNG, JPG, WebP, and DOCX up to {user?.role === 'free' ? '25MB' : '500MB'}</p>
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-heading font-bold text-xs shadow-lg shadow-rose-500/20 transition-all">
              <FileText className="w-4 h-4" />
              <span>Choose Files</span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">Popular tools</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {quickTools.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => onSelectTool(id)} className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-rose-500/40 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer">
                <Icon className="w-3.5 h-3.5 text-rose-400" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
