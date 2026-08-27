import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  Zap,
  ShieldCheck,
  Printer,
  Layers,
  Scissors,
  Minimize2,
  Image as ImageIcon,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react';
import { ToolId } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { createSamplePDF, createSampleImage } from '../../services/sampleFiles';
import { useNotification } from '../../context/NotificationContext';

interface HeroSectionProps {
  onSelectToolWithFiles: (toolId: ToolId, files: File[]) => void;
  onSelectTool: (toolId: ToolId) => void;
}

export function HeroSection({ onSelectToolWithFiles, onSelectTool }: HeroSectionProps) {
  const { user, dailyUsage, systemConfig, openQuotaModal } = useAuth();
  const { showToast } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  const isUnlimited = user?.role && user.role !== 'free';
  const limit = user?.customDailyLimit ?? systemConfig.freeDailyLimit;
  const remaining = Math.max(0, limit - dailyUsage.count);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

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

    if (files.length > 1 && isPDF) {
      onSelectToolWithFiles('merge-pdf', files);
    } else if (files.length > 1 && isImg) {
      onSelectToolWithFiles('image-to-pdf', files);
    } else if (isPDF) {
      onSelectToolWithFiles('compress-pdf', files);
    } else if (isImg) {
      onSelectToolWithFiles('image-to-pdf', files);
    } else {
      onSelectToolWithFiles('word-to-pdf', files);
    }
  };

  const handleLoadSamplePDF = async () => {
    setIsLoadingSample(true);
    try {
      const sample = await createSamplePDF('OmniPDF Quarterly Report', 3);
      showToast('success', 'Sample PDF Loaded', 'Loaded 3-page business document ready for testing.');
      onSelectToolWithFiles('compress-pdf', [sample]);
    } catch {
      showToast('error', 'Error', 'Could not generate sample file.');
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleLoadSampleImages = async () => {
    setIsLoadingSample(true);
    try {
      const img1 = await createSampleImage('Page 1 - Financial Chart', '#2563eb');
      const img2 = await createSampleImage('Page 2 - Executive Summary', '#7c3aed');
      showToast('success', 'Sample Images Loaded', 'Loaded 2 sample images ready for PDF conversion.');
      onSelectToolWithFiles('image-to-pdf', [img1, img2]);
    } catch {
      showToast('error', 'Error', 'Could not generate sample images.');
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-900">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-rose-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[300px] bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 mb-6 shadow-md backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Client-Side Zero Data Leaks</span>
            <span className="text-slate-600">•</span>
            {isUnlimited ? (
              <span className="text-indigo-400 font-bold">Pro Unlimited Active</span>
            ) : (
              <span className="text-rose-400">
                <strong>{remaining} of {limit}</strong> Free Daily Conversions
              </span>
            )}
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-white tracking-tight leading-[1.1]">
            Every PDF & Image Tool <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-rose-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              In One Modern SaaS Suite.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Merge, split, compress, convert, watermark, and directly print PDF and image files with
            instant browser execution. 3 free daily uses, no watermarks, and zero file uploads.
          </p>
        </div>

        {/* Dropzone Container */}
        <div className="max-w-2xl mx-auto mb-10">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-3xl p-8 sm:p-10 border-2 border-dashed transition-all cursor-pointer text-center group ${
              isDragging
                ? 'border-rose-500 bg-rose-950/20 scale-[1.01]'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt"
              className="hidden"
              onChange={handleFileInput}
            />

            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-indigo-500/20 border border-rose-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-rose-400" />
            </div>

            <h3 className="text-lg font-heading font-bold text-white mb-1">
              Drop your PDF or Image files here
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Supports PDF, PNG, JPG, WebP, DOCX up to {user?.role === 'free' ? '25MB' : '500MB'}
            </p>

            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-heading font-bold text-xs shadow-lg shadow-rose-500/20 transition-all">
              <FileText className="w-4 h-4" />
              <span>Choose Files from Device</span>
            </div>
          </div>

          {/* Sample Loaders bar for fast testing */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs text-slate-400">Quick Test Samples:</span>
            <button
              onClick={handleLoadSamplePDF}
              disabled={isLoadingSample}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Load 3-Page Sample PDF</span>
            </button>

            <button
              onClick={handleLoadSampleImages}
              disabled={isLoadingSample}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Load Sample Images</span>
            </button>
          </div>
        </div>

        {/* Quick Tool Shortcut Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          <button
            onClick={() => onSelectTool('merge-pdf')}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-rose-400" />
            <span>Merge PDF</span>
          </button>

          <button
            onClick={() => onSelectTool('split-pdf')}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>Split PDF</span>
          </button>

          <button
            onClick={() => onSelectTool('compress-pdf')}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Compress PDF</span>
          </button>

          <button
            onClick={() => onSelectTool('pdf-to-image')}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>PDF to Image</span>
          </button>

          <button
            onClick={() => onSelectTool('pdf-to-word')}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            <span>PDF to Word</span>
          </button>

          <button
            onClick={() => onSelectTool('print-pdf')}
            className="px-3.5 py-2 rounded-xl bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/30 text-xs font-semibold text-sky-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>Printout & Prep</span>
          </button>
        </div>
      </div>
    </section>
  );
}
