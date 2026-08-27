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
import { ToolId } from './types';
import { stripeService } from './services/stripeService';
import { updatePageSEO } from './services/seoService';

function AppContent() {
  const { user, isQuotaModalOpen, closeQuotaModal, quotaModalReason, upgradeSubscription } =
    useAuth();
  const { showToast } = useNotification();

  // Navigation State
  const [currentView, setCurrentView] = useState<'home' | 'tool' | 'dashboard' | 'admin' | 'pricing'>('home');
  const [activeToolId, setActiveToolId] = useState<ToolId>('compress-pdf');
  const [toolInitialFiles, setToolInitialFiles] = useState<File[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
    if (view === 'dashboard' && !user) {
      setCurrentView('home');
      setIsAuthModalOpen(true);
      return;
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Main Navbar — includes the single Pro Launch announcement bar */}
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

        {currentView === 'dashboard' && user && (
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
