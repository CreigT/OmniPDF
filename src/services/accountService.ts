import { getFirebaseIdToken } from './firebase';

async function headers() { const token=await getFirebaseIdToken(); if(!token) throw new Error('Sign in with Google first.'); return { 'Content-Type':'application/json', Authorization:`Bearer ${token}` }; }
export const accountService = {
  async getAccount(){ const res=await fetch('/api/account',{headers:await headers()}); if(!res.ok) throw new Error('Unable to load account.'); return res.json(); },
  async consumeUsage(){ const res=await fetch('/api/usage',{method:'POST',headers:await headers(),body:'{}'}); const data=await res.json(); return { ...data, ok:res.ok }; },
  async deleteAccount(){ const res=await fetch('/api/account',{method:'DELETE',headers:await headers()}); return res.ok; }
};
