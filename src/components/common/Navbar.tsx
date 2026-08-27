import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  ChevronDown,
  Sparkles,
  Shield,
  Layers,
  Scissors,
  Minimize2,
  Image as ImageIcon,
  FilePlus,
  RefreshCw,
  Printer,
  User as UserIcon,
  LayoutDashboard,
  LogOut,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ToolId } from '../../types';

interface NavbarProps {
  currentView: 'home' | 'tool' | 'dashboard' | 'admin' | 'pricing';
  onNavigate: (view: 'home' | 'tool' | 'dashboard' | 'admin' | 'pricing', toolId?: ToolId) => void;
  onSelectTool?: (toolId: ToolId) => void;
  onOpenAuth?: () => void;
}

export function Navbar({ currentView, onNavigate }: NavbarProps) {
  const { user, dailyUsage, systemConfig, openQuotaModal, openAuthModal, logout } = useAuth();
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isUnlimited = user?.role && user.role !== 'free';
  const limit = user?.customDailyLimit ?? systemConfig.freeDailyLimit;
  const remaining = Math.max(0, limit - dailyUsage.count);

  const toolLinks: { id: ToolId; label: string; description: string; icon: React.ElementType }[] = [
    { id: 'merge-pdf', label: 'Merge PDF', description: 'Combine multiple PDFs into one', icon: Layers },
    { id: 'split-pdf', label: 'Split PDF', description: 'Extract pages or separate ranges', icon: Scissors },
    { id: 'compress-pdf', label: 'Compress PDF', description: 'Reduce PDF file size', icon: Minimize2 },
    { id: 'print-pdf', label: 'Print & Prepare', description: 'Prepare documents for printing', icon: Printer },
    { id: 'pdf-to-image', label: 'PDF to Image', description: 'Convert pages to JPG, PNG, or WebP', icon: ImageIcon },
    { id: 'image-to-pdf', label: 'Image to PDF', description: 'Turn images into a PDF document', icon: FilePlus },
    { id: 'pdf-to-word', label: 'PDF to Word', description: 'Convert PDF content to DOCX', icon: FileText },
    { id: 'image-converter', label: 'Image Converter', description: 'Convert common image formats', icon: RefreshCw },
  ];

  const selectTool = (id: ToolId) => {
    onNavigate('tool', id);
    setIsToolsOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      {systemConfig.announcementBanner.enabled && (
        <div className="bg-gradient-to-r from-rose-900/90 via-purple-900/90 to-blue-900/90 border-b border-rose-500/30 text-rose-100 text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{systemConfig.announcementBanner.message}</span>
          <button onClick={() => openQuotaModal('Pro offer')} className="underline font-semibold hover:text-white ml-1 cursor-pointer">View Offer →</button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button id="nav-logo-btn" onClick={() => onNavigate('home')} className="flex items-center gap-2.5 group cursor-pointer text-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-indigo-600 p-0.5 shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <FileText className="w-5 h-5 text-rose-500 group-hover:text-rose-400 transition-colors" />
              </div>
            </div>
            <div>
              <span className="font-heading font-bold text-lg text-white tracking-tight">Omni<span className="text-rose-500">PDF</span></span>
              <span className="text-[10px] text-slate-400 block -mt-1">Private PDF & Image Tools</span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            <div className="relative">
              <button id="nav-tools-dropdown-btn" onClick={() => setIsToolsOpen(!isToolsOpen)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'tool' || isToolsOpen ? 'text-rose-400 bg-rose-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-900'}`}>
                <span>PDF Tools</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isToolsOpen ? 'rotate-180 text-rose-400' : 'text-slate-400'}`} />
              </button>

              <AnimatePresence>
                {isToolsOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsToolsOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.15 }} className="absolute left-0 top-full mt-2 w-[580px] z-30 p-4 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-2xl grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">PDF Essentials</p>
                        <div className="space-y-0.5">
                          {toolLinks.slice(0, 4).map(({ id, label, description, icon: Icon }) => (
                            <button key={id} onClick={() => selectTool(id)} className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors group cursor-pointer">
                              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors"><Icon className="w-4 h-4" /></div>
                              <div><p className="text-xs font-semibold text-slate-200 group-hover:text-white">{label}</p><p className="text-[11px] text-slate-400 line-clamp-1">{description}</p></div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">Convert Files</p>
                        <div className="space-y-0.5">
                          {toolLinks.slice(4).map(({ id, label, description, icon: Icon }) => (
                            <button key={id} onClick={() => selectTool(id)} className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors group cursor-pointer">
                              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors"><Icon className="w-4 h-4" /></div>
                              <div><p className="text-xs font-semibold text-slate-200 group-hover:text-white">{label}</p><p className="text-[11px] text-slate-400 line-clamp-1">{description}</p></div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button id="nav-pricing-btn" onClick={() => onNavigate('pricing')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${currentView === 'pricing' ? 'text-rose-400 bg-rose-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-900'}`}>Pricing</button>

            {user && (
              <button id="nav-dashboard-btn" onClick={() => onNavigate('dashboard')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${currentView === 'dashboard' ? 'text-rose-400 bg-rose-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-900'}`}>My Account</button>
            )}

            {user?.role === 'admin' && (
              <button id="nav-admin-btn" onClick={() => onNavigate('admin')} className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${currentView === 'admin' ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20' : 'text-slate-300 hover:text-indigo-300 hover:bg-indigo-950/30'}`}>
                <Shield className="w-3.5 h-3.5 text-indigo-400" /><span>Admin</span>
              </button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isUnlimited ? (
            <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-rose-500/10 border border-indigo-500/30 text-indigo-300 hover:border-indigo-400 text-xs font-semibold shadow-sm transition-all cursor-pointer">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /><span>Unlimited</span>
            </button>
          ) : (
            <button id="quota-indicator-btn" onClick={() => openQuotaModal()} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-xs font-medium transition-all group cursor-pointer">
              <span className="text-slate-300"><strong className="text-white font-bold">{remaining}</strong> / {limit} free uses left</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full group-hover:bg-rose-500 group-hover:text-white transition-colors">Upgrade</span>
            </button>
          )}

          {user ? (
            <div className="relative">
              <button id="user-profile-menu-btn" onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-800 cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">{user.name ? user.name[0] : 'U'}</div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>
              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsProfileOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} className="absolute right-0 top-full mt-2 w-64 z-30 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl backdrop-blur-2xl">
                      <div className="px-3 py-2.5 border-b border-slate-800/80 mb-1"><p className="text-xs font-bold text-white truncate">{user.name}</p><p className="text-[11px] text-slate-400 truncate">{user.email}</p></div>
                      <button onClick={() => { onNavigate('dashboard'); setIsProfileOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"><LayoutDashboard className="w-4 h-4 text-slate-400" /><span>My Account & History</span></button>
                      <button onClick={() => { onNavigate('pricing'); setIsProfileOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"><Sparkles className="w-4 h-4 text-amber-400" /><span>Plans & Billing</span></button>
                      {user.role === 'admin' && <button onClick={() => { onNavigate('admin'); setIsProfileOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-indigo-300 hover:text-indigo-200 hover:bg-indigo-950/40 transition-colors cursor-pointer"><Shield className="w-4 h-4 text-indigo-400" /><span>Administration</span></button>}
                      <div className="border-t border-slate-800/80 my-1" />
                      <button onClick={() => { logout(); setIsProfileOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"><LogOut className="w-4 h-4" /><span>Sign Out</span></button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button id="auth-sign-in-btn" onClick={openAuthModal} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-bold shadow-lg shadow-rose-500/20 transition-all cursor-pointer"><UserIcon className="w-3.5 h-3.5" /><span>Sign In</span></button>
          )}
        </div>
      </div>
    </header>
  );
}
