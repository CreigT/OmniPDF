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
import { getFirebaseIdToken } from './services/firebase';
import { updatePageSEO } from './services/seoService';

function AppContent() {
  const { user, isQuotaModalOpen, closeQuotaModal, quotaModalReason, login } = useAuth();
  const { showToast } = useNotification();
  const [currentView, setCurrentView] = useState<'home'|'tool'|'dashboard'|'admin'|'pricing'>('home');
  const [activeToolId, setActiveToolId] = useState<ToolId>('compress-pdf');
  const [toolInitialFiles, setToolInitialFiles] = useState<File[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(()=>{const params=new URLSearchParams(window.location.search);const requestedTool=params.get('tool') as ToolId|null;const requestedView=params.get('view') as any;if(requestedTool&&TOOLS.some(t=>t.id===requestedTool)){setActiveToolId(requestedTool);setCurrentView('tool');}else if(requestedView&&['home','dashboard','admin','pricing'].includes(requestedView))setCurrentView(requestedView);},[]);
  useEffect(()=>{updatePageSEO({viewName:currentView,tool:TOOLS.find(t=>t.id===activeToolId)});},[currentView,activeToolId]);

  useEffect(()=>{const params=new URLSearchParams(window.location.search);const paymentStatus=params.get('payment_status');const sessionId=params.get('session_id');if(paymentStatus==='success'&&sessionId){stripeService.verifySession(sessionId).then(async result=>{if(result.valid){const token=await getFirebaseIdToken();if(token){const accountRes=await fetch('/api/account',{headers:{Authorization:`Bearer ${token}`}});if(accountRes.ok){const account=await accountRes.json();login(account.role||'free',account.email||user?.email,account.name||user?.name);}}showToast('success','Payment Confirmed with Stripe!','Your purchase is verified. Your account entitlement is controlled securely by the server.');}else showToast('error','Payment Verification','We could not verify this checkout for the signed-in account.');});window.history.replaceState({},document.title,window.location.pathname);}else if(paymentStatus==='cancelled'){showToast('info','Checkout Cancelled','No charges were made to your card.');window.history.replaceState({},document.title,window.location.pathname);}},[login,showToast,user?.email,user?.name]);

  const currentTool=TOOLS.find(t=>t.id===activeToolId)||TOOLS[0];
  const handleSelectTool=(toolId:ToolId)=>{setActiveToolId(toolId);setToolInitialFiles([]);setCurrentView('tool');window.scrollTo({top:0,behavior:'smooth'});};
  const handleSelectToolWithFiles=(toolId:ToolId,files:File[])=>{setActiveToolId(toolId);setToolInitialFiles(files);setCurrentView('tool');window.scrollTo({top:0,behavior:'smooth'});};
  const handleNavigate=(view:'home'|'dashboard'|'admin'|'pricing')=>{if(view==='dashboard'&&!user){setCurrentView('home');setIsAuthModalOpen(true);return;}setCurrentView(view);window.scrollTo({top:0,behavior:'smooth'});};

  return <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
    <Navbar currentView={currentView} onNavigate={handleNavigate} onSelectTool={handleSelectTool} onOpenAuth={()=>setIsAuthModalOpen(true)} />
    <main className="flex-1">
      {currentView==='home'&&<><HeroSection onSelectTool={handleSelectTool} onSelectToolWithFiles={handleSelectToolWithFiles}/><ToolsGrid onSelectTool={handleSelectTool}/><FeaturesSection/><PricingSection/><FaqSection/></>}
      {currentView==='tool'&&<ToolRunner tool={currentTool} initialFiles={toolInitialFiles} onBack={()=>handleNavigate('home')} onNavigateToDashboard={()=>handleNavigate('dashboard')}/>} 
      {currentView==='dashboard'&&user&&<UserDashboard onSelectTool={handleSelectTool} onNavigateToPricing={()=>handleNavigate('pricing')}/>} 
      {currentView==='admin'&&(user?.role==='admin'?<AdminPanel onExit={()=>handleNavigate('home')}/>:<AdminLogin onSuccess={()=>setCurrentView('admin')} onBackToApp={()=>handleNavigate('home')}/>)}
      {currentView==='pricing'&&<div className="py-12"><PricingSection/><FaqSection/></div>}
    </main>
    <Footer onSelectTool={handleSelectTool} onNavigate={handleNavigate}/>
    <QuotaModal isOpen={isQuotaModalOpen} onClose={closeQuotaModal} reason={quotaModalReason}/>
    <AuthModal isOpen={isAuthModalOpen} onClose={()=>setIsAuthModalOpen(false)}/>
  </div>;
}
export default function App(){return <NotificationProvider><AuthProvider><AppContent/></AuthProvider></NotificationProvider>;}
