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
  Stamp,
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

export function Navbar({ currentView, onNavigate, onSelectTool, onOpenAuth }: NavbarProps) {
  const { user, dailyUsage, systemConfig, openQuotaModal, openAuthModal, logout } =
    useAuth();
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isUnlimited = user?.role && user.role !== 'free';
  const limit = user?.customDailyLimit ?? systemConfig.freeDailyLimit;
  const remaining = Math.max(0, limit - dailyUsage.count);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      {/* Announcement Banner if enabled */}
      {systemConfig.announcementBanner.enabled && (
        <div className="bg-gradient-to-r from-rose-900/90 via-purple-900/90 to-blue-900/90 border-b border-rose-500/30 text-rose-100 text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>{systemConfig.announcementBanner.message}</span>
          <button
            onClick={() => openQuotaModal('Pro Launch Discount')}
            className="underline font-semibold hover:text-white ml-1 cursor-pointer"
          >
            Claim Pro Now →
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <button
            id="nav-logo-btn"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 group cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-indigo-600 p-0.5 shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <FileText className="w-5 h-5 text-rose-500 group-hover:text-rose-400 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-lg text-white tracking-tight">
                  Omni<span className="text-rose-500">PDF</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Pro SaaS
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block -mt-1">
                Fast & Secure PDF Suite
              </span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Tools Dropdown */}
            <div className="relative">
              <button
                id="nav-tools-dropdown-btn"
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'tool' || isToolsOpen
                    ? 'text-rose-400 bg-rose-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>All PDF Tools</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isToolsOpen ? 'rotate-180 text-rose-400' : 'text-slate-400'}`}
                />
              </button>

              <AnimatePresence>
                {isToolsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsToolsOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full mt-2 w-[580px] z-30 p-4 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-2xl grid grid-cols-2 gap-3"
                    >
                      {/* Left Column: Core Tools */}
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">
                          Core PDF Operations
                        </p>
                        <div className="space-y-0.5">
                          <button
                            onClick={() => {
                              onNavigate('tool', 'merge-pdf');
                              setIsToolsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors group cursor-pointer"
                          >
                            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                              <Layers className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                                Merge PDF
                              </p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                Combine multiple PDFs into one
                              </p>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              onNavigate('tool', 'split-pdf');
                              setIsToolsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors group cursor-pointer"
                          >
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                              <Scissors className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                                Split PDF
                              </p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                Extract pages or separate ranges
                              </p>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              onNavigate('tool', 'compress-pdf');
                              setIsToolsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors group cursor-pointer"
                          >
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                              <Minimize2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                                Compress PDF
                              </p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                Reduce file size without quality loss
                              </p>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              onNavigate('tool', 'print-pdf');
                              setIsToolsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors group cursor-pointer"
                          >
                            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                              <Printer className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                                Printout & Prep
                              </p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                Direct print with custom layout & watermark
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Right Column: Conversions */}
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">
                          Conversions & Image Tools
                        </p>
                        <div className="space-y-0.5">
                          <button
                            onClick={() => {
                              onNavigate('tool', 'pdf-to-image');
                              setIsToolsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors group cursor-pointer"
                          >
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                                PDF to Image
                              </p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                High-res JPG, PNG, WebP
                              </p>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              onNavigate('tool', 'image-to-pdf');
                              setIsToolsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors group cursor-pointer"
                          >
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                              <FilePlus className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                                Image to PDF
                              </p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                Convert JPG/PNG to PDF document
                              </p>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              onNavigate('tool', 'pdf-to-word');
                              setIsToolsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors group cursor-pointer"
                          >
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                                PDF to Word
                              </p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                Editable DOCX formatted text
                              </p>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              onNavigate('tool', 'image-converter');
                              setIsToolsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors group cursor-pointer"
                          >
                            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                              <RefreshCw className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                                Image Converter
                              </p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                PNG, JPG, WebP, SVG format batch
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button
              id="nav-pricing-btn"
              onClick={() => onNavigate('pricing')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentView === 'pricing'
                  ? 'text-rose-400 bg-rose-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              Pricing & Plans
            </button>

            <button
              id="nav-dashboard-btn"
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentView === 'dashboard'
                  ? 'text-rose-400 bg-rose-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              User Dashboard
            </button>

            {user?.role === 'admin' && (
              <button
                id="nav-admin-btn"
                onClick={() => onNavigate('admin')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  currentView === 'admin'
                    ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20'
                    : 'text-slate-300 hover:text-indigo-300 hover:bg-indigo-950/30'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Admin Panel</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right side controls: Quota Badge + User */}
        <div className="flex items-center gap-3">
          {/* Daily Quota Tracker Pill */}
          {isUnlimited ? (
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-rose-500/10 border border-indigo-500/30 text-indigo-300 hover:border-indigo-400 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Unlimited Access</span>
            </button>
          ) : (
            <button
              id="quota-indicator-btn"
              onClick={() => openQuotaModal()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-xs font-medium transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-slate-300">
                  <strong className="text-white font-bold">{remaining}</strong> / {limit} left today
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full group-hover:bg-rose-500 group-hover:text-white transition-colors">
                Upgrade
              </span>
            </button>
          )}

          {/* User Profile / Auth Button */}
          {user ? (
            <div className="relative">
              <button
                id="user-profile-menu-btn"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-800 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                  {user.name ? user.name[0] : 'U'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-64 z-30 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl backdrop-blur-2xl"
                    >
                      <div className="px-3 py-2.5 border-b border-slate-800/80 mb-1">
                        <p className="text-xs font-bold text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {user.role} Tier
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onNavigate('dashboard');
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        <span>User Dashboard & History</span>
                      </button>

                      <button
                        onClick={() => {
                          onNavigate('pricing');
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Manage Subscription</span>
                      </button>

                      {user.role === 'admin' && (
                        <button
                          onClick={() => {
                            onNavigate('admin');
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-indigo-300 hover:text-indigo-200 hover:bg-indigo-950/40 transition-colors cursor-pointer"
                        >
                          <Shield className="w-4 h-4 text-indigo-400" />
                          <span>Admin Control Panel</span>
                        </button>
                      )}

                      <div className="border-t border-slate-800/80 my-1" />

                      <button
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              id="auth-sign-in-btn"
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-bold shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
