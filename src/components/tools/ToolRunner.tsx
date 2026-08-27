import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UploadCloud,
  FileText,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Download,
  Printer,
  Sparkles,
  Sliders,
  RefreshCw,
  Clock,
  Zap,
  Lock,
  Stamp,
  RotateCw,
  FileCheck,
  AlertTriangle,
  ArrowLeft,
  Eye,
} from 'lucide-react';
import { ToolDefinition, ToolId } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { createSamplePDF, createSampleImage } from '../../services/sampleFiles';
import {
  mergePDFs,
  splitPDF,
  compressPDF,
  pdfToImages,
  imagesToPDF,
  pdfToWord,
  wordToPDF,
  imageFormatConverter,
  watermarkPDF,
  rotatePDF,
  protectPDF,
  PDFEngineResult,
} from '../../services/pdfEngine';
import { PrintModal } from '../common/PrintModal';

interface ToolRunnerProps {
  tool: ToolDefinition;
  initialFiles?: File[];
  onBack: () => void;
  onNavigateToDashboard: () => void;
}

export function ToolRunner({
  tool,
  initialFiles = [],
  onBack,
  onNavigateToDashboard,
}: ToolRunnerProps) {
  const { user, canPerformAction, recordUsage, openQuotaModal, dailyUsage, systemConfig } = useAuth();
  const { showToast } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>(initialFiles);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [result, setResult] = useState<PDFEngineResult | null>(null);
  const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null);

  // Tool Specific Options State
  const [compressLevel, setCompressLevel] = useState<'extreme' | 'recommended' | 'less'>('recommended');
  const [splitMode, setSplitMode] = useState<'all' | 'range'>('range');
  const [splitRange, setSplitRange] = useState('1-2');
  const [imgFormat, setImgFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [imgDpi, setImgDpi] = useState<number>(150);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageMargin, setPageMargin] = useState<number>(20);
  const [targetImgFormat, setTargetImgFormat] = useState<'png' | 'jpeg' | 'webp' | 'svg' | 'ico'>('webp');
  const [imgQuality, setImgQuality] = useState<number>(0.9);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkColor, setWatermarkColor] = useState('#ef4444');
  const [rotateAngle, setRotateAngle] = useState<90 | 180 | 270>(90);
  const [protectPassword, setProtectPassword] = useState('SecretPass123');

  // Dedicated Print Modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Set initial files if passed
  useEffect(() => {
    if (initialFiles.length > 0) {
      setFiles(initialFiles);
    }
  }, [initialFiles]);

  // Clean up blob URL on unmount or reset
  useEffect(() => {
    return () => {
      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl);
    };
  }, [resultBlobUrl]);

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
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    // Check file size limits
    const maxMB = user?.role === 'free' ? systemConfig.maxFreeFileSizeMB : systemConfig.maxProFileSizeMB;
    const oversized = newFiles.find((f) => f.size > maxMB * 1024 * 1024);

    if (oversized) {
      showToast(
        'error',
        'File Too Large',
        `${oversized.name} exceeds your tier's ${maxMB}MB limit. Upgrade to Pro for 500MB uploads.`
      );
      if (user?.role === 'free') {
        openQuotaModal('Upload limit exceeded');
      }
      return;
    }

    if (tool.multiple) {
      setFiles((prev) => [...prev, ...newFiles]);
    } else {
      setFiles([newFiles[0]]);
    }
    setResult(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFiles.length) return;
    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIndex];
    newFiles[targetIndex] = temp;
    setFiles(newFiles);
  };

  const handleLoadSample = async () => {
    try {
      if (tool.id === 'image-to-pdf' || tool.id === 'image-converter') {
        const img1 = await createSampleImage('Sample Diagram 1', '#2563eb');
        const img2 = await createSampleImage('Sample Chart 2', '#7c3aed');
        setFiles([img1, img2]);
      } else {
        const sample = await createSamplePDF(`${tool.name} Sample Document`, 3);
        setFiles([sample]);
      }
      setResult(null);
      showToast('success', 'Sample Document Loaded', 'You can now run this tool with sample data.');
    } catch {
      showToast('error', 'Error', 'Could not load sample.');
    }
  };

  const executeTool = async () => {
    if (files.length === 0) {
      showToast('error', 'No File Selected', 'Please upload or load a sample document first.');
      return;
    }

    // Check daily quota permission
    const check = canPerformAction();
    if (!check.allowed) {
      openQuotaModal(check.reason);
      return;
    }

    setIsProcessing(true);
    setProgressStep('Parsing document structure...');
    const startTime = Date.now();

    try {
      let res: PDFEngineResult;

      switch (tool.id) {
        case 'merge-pdf':
          setProgressStep('Merging PDF pages & indexing catalog...');
          res = await mergePDFs(files);
          break;

        case 'split-pdf':
          setProgressStep('Splitting PDF streams...');
          res = await splitPDF(files[0], { mode: splitMode, pageRanges: splitRange });
          break;

        case 'compress-pdf':
          setProgressStep('Optimizing object streams & stripping metadata...');
          res = await compressPDF(files[0], compressLevel);
          break;

        case 'pdf-to-image':
          setProgressStep('Rasterizing vector pages to image formats...');
          res = await pdfToImages(files[0], imgFormat, imgDpi);
          break;

        case 'image-to-pdf':
          setProgressStep('Assembling images into calibrated PDF document...');
          res = await imagesToPDF(files, { pageSize, orientation, margin: pageMargin });
          break;

        case 'pdf-to-word':
          setProgressStep('Extracting layout text to editable DOCX structure...');
          res = await pdfToWord(files[0]);
          break;

        case 'word-to-pdf':
          setProgressStep('Compiling document text to standardized PDF...');
          res = await wordToPDF(files[0]);
          break;

        case 'image-converter':
          setProgressStep(`Converting images to ${targetImgFormat.toUpperCase()}...`);
          res = await imageFormatConverter(files, targetImgFormat, imgQuality);
          break;

        case 'print-pdf':
          setProgressStep('Preparing print stream layout & watermarks...');
          res = await compressPDF(files[0], 'less');
          break;

        case 'watermark-pdf':
          setProgressStep('Applying vector watermark overlay...');
          res = await watermarkPDF(files[0], watermarkText, 0.35, watermarkColor);
          break;

        case 'rotate-pdf':
          setProgressStep(`Rotating pages ${rotateAngle} degrees...`);
          res = await rotatePDF(files[0], rotateAngle);
          break;

        case 'protect-pdf':
          setProgressStep('Applying 256-bit security encryption headers...');
          res = await protectPDF(files[0], protectPassword);
          break;

        default:
          res = await compressPDF(files[0], 'recommended');
      }

      const duration = Date.now() - startTime;
      const url = URL.createObjectURL(res.blob);
      setResultBlobUrl(url);
      setResult(res);

      // Calculate savings % if applicable
      let savingsPct: number | undefined;
      if (res.originalSize > 0 && res.filesize < res.originalSize) {
        savingsPct = Math.round(((res.originalSize - res.filesize) / res.originalSize) * 100);
      }

      // Record in auth & history context
      recordUsage(
        tool.id,
        tool.name,
        files,
        {
          name: res.filename,
          size: res.filesize,
          type: res.blob.type,
          blobUrl: url,
        },
        duration,
        savingsPct
      );

      showToast(
        'success',
        'Operation Completed!',
        `Successfully processed in ${duration}ms. Download or print below.`
      );

      // If print tool, automatically suggest opening print modal
      if (tool.id === 'print-pdf') {
        setIsPrintModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Processing Failed', 'An error occurred while processing your document.');
    } finally {
      setIsProcessing(false);
      setProgressStep('');
    }
  };

  const handleDownload = () => {
    if (!result || !resultBlobUrl) return;
    const a = document.createElement('a');
    a.href = resultBlobUrl;
    a.download = result.filename;
    a.click();
    showToast('success', 'Download Started', result.filename);
  };

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Breadcrumb / Back button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Tools</span>
        </button>

        {/* Quota indicator */}
        <div className="flex items-center gap-2">
          {user?.role && user.role !== 'free' ? (
            <span className="text-xs text-indigo-300 bg-indigo-950/50 border border-indigo-500/30 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>Pro Unlimited Access</span>
            </span>
          ) : (
            <button
              onClick={() => openQuotaModal()}
              className="text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 px-3 py-1 rounded-full font-medium hover:bg-rose-900/40 transition-colors cursor-pointer"
            >
              <strong>{Math.max(0, systemConfig.freeDailyLimit - dailyUsage.count)}</strong> of{' '}
              {systemConfig.freeDailyLimit} free conversions left today
            </button>
          )}
        </div>
      </div>

      {/* Tool Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
                {tool.name}
              </h1>
              {tool.badge && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {tool.badge}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">{tool.longDesc}</p>
          </div>

          <button
            onClick={handleLoadSample}
            className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Load Sample File</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (2 columns: Dropzone/Files vs Options) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: File Dropzone & File List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-2xl p-6 sm:p-8 border-2 border-dashed text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-rose-500 bg-rose-950/20'
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple={tool.multiple}
              accept={tool.accept}
              className="hidden"
              onChange={handleFileInput}
            />

            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <UploadCloud className="w-6 h-6 text-rose-400" />
            </div>
            <p className="text-sm font-bold text-white mb-1">
              {files.length > 0
                ? tool.multiple
                  ? 'Add more files or drop here'
                  : 'Replace file or drop here'
                : 'Click to select or drag & drop files'}
            </p>
            <p className="text-[11px] text-slate-400">
              Accepted: {tool.accept.replace(/application\/[a-z0-9-]+,?/g, '')}
            </p>
          </div>

          {/* Uploaded File List */}
          {files.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 mb-2">
                <span>Selected Files ({files.length})</span>
                <span>
                  Total:{' '}
                  {(files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {files.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-200 truncate">{f.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {(f.size / 1024).toFixed(1)} KB • {f.type || 'document'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {tool.multiple && files.length > 1 && (
                        <>
                          <button
                            onClick={() => moveFile(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveFile(idx, 'down')}
                            disabled={idx === files.length - 1}
                            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => removeFile(idx)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Tool Settings & Execution Action (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Sliders className="w-4 h-4 text-rose-400" />
              <span>Conversion Options</span>
            </div>

            {/* Dynamic tool configuration options */}
            {tool.id === 'compress-pdf' && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  Compression Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setCompressLevel('extreme')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      compressLevel === 'extreme'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <p>Extreme</p>
                    <p className="text-[10px] font-normal opacity-75">~55% smaller</p>
                  </button>

                  <button
                    onClick={() => setCompressLevel('recommended')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      compressLevel === 'recommended'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <p>Recommended</p>
                    <p className="text-[10px] font-normal opacity-75">Good quality</p>
                  </button>

                  <button
                    onClick={() => setCompressLevel('less')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      compressLevel === 'less'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <p>Less</p>
                    <p className="text-[10px] font-normal opacity-75">High quality</p>
                  </button>
                </div>
              </div>
            )}

            {tool.id === 'split-pdf' && (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-300">Split Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSplitMode('range')}
                    className={`p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      splitMode === 'range'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Extract Range
                  </button>
                  <button
                    onClick={() => setSplitMode('all')}
                    className={`p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      splitMode === 'all'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    All Pages (ZIP)
                  </button>
                </div>

                {splitMode === 'range' && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Page Ranges (e.g. 1-2, 4)
                    </label>
                    <input
                      type="text"
                      value={splitRange}
                      onChange={(e) => setSplitRange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                )}
              </div>
            )}

            {tool.id === 'pdf-to-image' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Output Image Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setImgFormat(fmt)}
                        className={`p-2 rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer ${
                          imgFormat === fmt
                            ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Resolution Quality
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setImgDpi(150)}
                      className={`p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        imgDpi === 150
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      150 DPI (Standard)
                    </button>
                    <button
                      onClick={() => setImgDpi(300)}
                      className={`p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        imgDpi === 300
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      300 DPI (Print Res)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tool.id === 'image-to-pdf' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    PDF Page Size
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['a4', 'letter', 'fit'] as const).map((ps) => (
                      <button
                        key={ps}
                        onClick={() => setPageSize(ps)}
                        className={`p-2 rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer ${
                          pageSize === ps
                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {ps}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Orientation
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['portrait', 'landscape'] as const).map((ori) => (
                      <button
                        key={ori}
                        onClick={() => setOrientation(ori)}
                        className={`p-2 rounded-xl border text-xs capitalize font-medium transition-all cursor-pointer ${
                          orientation === ori
                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {ori}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tool.id === 'image-converter' && (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Format
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['webp', 'png', 'jpeg', 'svg', 'ico'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTargetImgFormat(tf)}
                      className={`p-2 rounded-xl border text-[11px] font-bold uppercase transition-all cursor-pointer ${
                        targetImgFormat === tf
                          ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {tf === 'jpeg' ? 'JPG' : tf}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tool.id === 'watermark-pdf' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Watermark Text
                  </label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-rose-500 font-bold"
                  />
                </div>
              </div>
            )}

            {tool.id === 'rotate-pdf' && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">Rotation Angle</label>
                <div className="grid grid-cols-3 gap-2">
                  {([90, 180, 270] as const).map((ang) => (
                    <button
                      key={ang}
                      onClick={() => setRotateAngle(ang)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        rotateAngle === ang
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>{ang}°</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Execute Button */}
            <button
              id="execute-tool-btn"
              onClick={executeTool}
              disabled={files.length === 0 || isProcessing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-heading font-bold text-sm shadow-xl shadow-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{progressStep || 'Processing Document...'}</span>
                </>
              ) : (
                <>
                  <span>{tool.actionText}</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Quick Printout Button on any tool */}
          {files.length > 0 && (
            <button
              id="open-printout-dialog-btn"
              onClick={() => setIsPrintModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 hover:text-sky-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Open PDF Printout Studio</span>
            </button>
          )}
        </div>
      </div>

      {/* Result Card (When Processing Completes) */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8 p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-emerald-500/40 shadow-2xl space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-bold text-white">
                    Processing Finished Successfully!
                  </h3>
                  <p className="text-xs text-slate-400">
                    File: <strong className="text-slate-200">{result.filename}</strong>
                  </p>
                </div>
              </div>

              {/* Savings pill if compressed */}
              {result.originalSize > result.filesize && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-bold self-start sm:self-auto">
                  <Zap className="w-3.5 h-3.5" />
                  <span>
                    Reduced from {(result.originalSize / 1024).toFixed(1)} KB to{' '}
                    {(result.filesize / 1024).toFixed(1)} KB (
                    {Math.round(((result.originalSize - result.filesize) / result.originalSize) * 100)}
                    % smaller)
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                id="download-result-btn"
                onClick={handleDownload}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Converted File ({(result.filesize / 1024).toFixed(1)} KB)</span>
              </button>

              <button
                id="print-result-btn"
                onClick={() => setIsPrintModalOpen(true)}
                className="px-5 py-3 rounded-xl bg-sky-950/60 hover:bg-sky-900/60 border border-sky-500/30 text-sky-300 hover:text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-sky-400" />
                <span>Print Document</span>
              </button>

              <button
                onClick={onNavigateToDashboard}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                View in History & Dashboard →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dedicated Printout Modal */}
      {isPrintModalOpen && files.length > 0 && (
        <PrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          file={files[0]}
          blobUrl={resultBlobUrl || undefined}
          pageCount={result?.pageCount || 3}
        />
      )}
    </div>
  );
}
