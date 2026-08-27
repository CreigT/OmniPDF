import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { QuotaModal } from './components/common/QuotaModal';
import { AuthModal } from './components/auth/AuthModal';
import { HeroSection } from './components/home/HeroSection';
import { ToolsGrid } from './components/home/ToolsGrid';
import { FeaturesSection } from './components/home/FeaturesSection';
import { PricingSection } from './components/home/PricingSection';
import { FaqSection } from './components/home/FaqSection';
import { ToolRunner } from './components/tools/ToolRunner';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { AdminPanel } from './components/admin/AdminPanel';
import { AdminLogin } from './components/admin/AdminLogin';
import { TOOLS } from './data/tools';
import { ToolId, ToolDefinition } from './types';
import { Sparkles, Info, X } from 'lucide-react';
import { stripeService } from './services/stripeService';
import { updatePageSEO } from './services/seoService';

function AppContent() {
  const { user, isQuotaModalOpen, closeQuotaModal, quotaModalReason, systemConfig, upgradeSubscription } =
    useAuth();
  const { showToast } = useNotification();

  // Navigation State
  const [currentView, setCurrentView] = useState<'home' | 'tool' | 'dashboard' | 'admin' | 'pricing'>('home');
  const [activeToolId, setActiveToolId] = useState<ToolId>('compress-pdf');
  const [toolInitialFiles, setToolInitialFiles] = useState<File[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Deep Link URL initialization on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTool = params.get('tool') as ToolId | null;
    const requestedView = params.get('view') as any;

    if (requestedTool && TOOLS.some((t) => t.id === requestedTool)) {
      setActiveToolId(requestedTool);
      setCurrentView('tool');
    } else if (requestedView && ['home', 'dashboard', 'admin', 'pricing'].includes(requestedView)) {
      setCurrentView(requestedView);
    }
  }, []);

  // Dynamic SEO Tag updates on navigation and tool switches
  useEffect(() => {
    const activeTool = TOOLS.find((t) => t.id === activeToolId);
    updatePageSEO({
      viewName: currentView,
      tool: activeTool,
    });
  }, [currentView, activeToolId]);

  // Stripe Checkout return listener
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment_status');
    const sessionId = params.get('session_id');
    const planParam = params.get('plan') || 'pro_monthly';

    if (paymentStatus === 'success' && sessionId) {
      stripeService.verifySession(sessionId).then((result) => {
        if (result.valid) {
          const planId = planParam.includes('annual') ? 'pro_annual' : planParam.includes('team') ? 'team_monthly' : planParam.includes('enterprise') ? 'enterprise' : 'pro_monthly';
          upgradeSubscription(planId as any, { brand: 'visa', last4: '4242' });
          showToast('success', 'Payment Confirmed with Stripe!', 'Your subscription is active. You now have unlimited daily PDF conversions.');
        }
      });
      // Clean query params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      showToast('info', 'Checkout Cancelled', 'No charges were made to your card.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [upgradeSubscription, showToast]);

  // Active Tool Definition
  const currentTool = TOOLS.find((t) => t.id === activeToolId) || TOOLS[0];

  const handleSelectTool = (toolId: ToolId) => {
    setActiveToolId(toolId);
    setToolInitialFiles([]);
    setCurrentView('tool');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectToolWithFiles = (toolId: ToolId, files: File[]) => {
    setActiveToolId(toolId);
    setToolInitialFiles(files);
    setCurrentView('tool');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: 'home' | 'dashboard' | 'admin' | 'pricing') => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Announcement Banner */}
      {systemConfig.announcementBanner.enabled && !bannerDismissed && (
        <div className="bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 px-4 py-2 text-center text-xs font-semibold text-white flex items-center justify-center gap-2 relative">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{systemConfig.announcementBanner.message}</span>
          <button
            onClick={() => setBannerDismissed(true)}
            className="absolute right-3 p-1 rounded hover:bg-white/20 text-white/80 hover:text-white cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onSelectTool={handleSelectTool}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Body Routing */}
      <main className="flex-1">
        {currentView === 'home' && (
          <>
            <HeroSection
              onSelectTool={handleSelectTool}
              onSelectToolWithFiles={handleSelectToolWithFiles}
            />
            <ToolsGrid onSelectTool={handleSelectTool} />
            <FeaturesSection />
            <PricingSection />
            <FaqSection />
          </>
        )}

        {currentView === 'tool' && (
          <ToolRunner
            tool={currentTool}
            initialFiles={toolInitialFiles}
            onBack={() => handleNavigate('home')}
            onNavigateToDashboard={() => handleNavigate('dashboard')}
          />
        )}

        {currentView === 'dashboard' && (
          <UserDashboard
            onSelectTool={handleSelectTool}
            onNavigateToPricing={() => handleNavigate('pricing')}
          />
        )}

        {currentView === 'admin' && (
          user?.role === 'admin' ? (
            <AdminPanel onExit={() => handleNavigate('home')} />
          ) : (
            <AdminLogin
              onSuccess={() => setCurrentView('admin')}
              onBackToApp={() => handleNavigate('home')}
            />
          )
        )}

        {currentView === 'pricing' && (
          <div className="py-12">
            <PricingSection />
            <FaqSection />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer onSelectTool={handleSelectTool} onNavigate={handleNavigate} />

      {/* Subscription Paywall Quota Modal */}
      <QuotaModal
        isOpen={isQuotaModalOpen}
        onClose={closeQuotaModal}
        reason={quotaModalReason}
      />

      {/* User Authentication & Persona Switcher Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </NotificationProvider>
  );
}
