import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { signInWithGoogle } from '../../services/firebase';

export function AuthModal({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const { isAuthModalOpen, closeAuthModal, login } = useAuth();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(false);
  const open = isOpen ?? isAuthModalOpen;
  const close = onClose ?? closeAuthModal;
  if (!open) return null;

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const firebaseUser = await signInWithGoogle();
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/account', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Unable to load your OmniPDF account.');
      const account = await response.json();
      login(account.role || 'free', firebaseUser.email || '', firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'OmniPDF User');
      showToast('success', 'Welcome to OmniPDF', 'Signed in securely with Google.');
      close();
    } catch (error: any) { showToast('error', 'Google Sign-In Failed', error.message || 'Please try again.'); }
    finally { setLoading(false); }
  };

  return <AnimatePresence><div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={close}/>
    <motion.div initial={{opacity:0,scale:.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.95,y:20}} className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-8">
      <button onClick={close} className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"><X className="w-5 h-5"/></button>
      <div className="text-center mb-6"><h3 className="font-heading font-extrabold text-2xl text-white">Sign in to OmniPDF</h3><p className="text-xs text-slate-400 mt-2">Use your Google account to securely access your quota, credits, purchases, and Pro subscription.</p></div>
      <button type="button" disabled={loading} onClick={handleGoogle} className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-heading font-bold text-xs shadow-lg flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-60"><span className="text-lg font-bold">G</span><span>{loading?'Connecting securely…':'Continue with Google'}</span></button>
      <p className="mt-5 text-[11px] leading-relaxed text-center text-slate-500">Authentication is handled by Google through Firebase. OmniPDF never receives or stores your Google password.</p>
    </motion.div>
  </div></AnimatePresence>;
}
