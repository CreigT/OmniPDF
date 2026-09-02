import { getFirebaseIdToken } from './firebase';

export type OmniPlanId = 'single_use' | 'credits_10' | 'credits_30' | 'pro';
export interface StripeCheckoutOptions { planId: OmniPlanId; userEmail?: string; }
export interface StripeStatus { configured: boolean; publishableKey?: string; }

async function authHeaders() {
  const token = await getFirebaseIdToken();
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export const stripeService = {
  async getStatus(): Promise<StripeStatus> {
    try { const res = await fetch('/api/stripe/status'); return res.ok ? await res.json() : { configured: false }; } catch { return { configured: false }; }
  },
  async createCheckoutSession(options: StripeCheckoutOptions): Promise<{ url?: string; sessionId?: string; error?: string }> {
    try { const res = await fetch('/api/stripe/create-checkout-session', { method: 'POST', headers: await authHeaders(), body: JSON.stringify({ planId: options.planId }) }); const data = await res.json(); return res.ok ? { url: data.url, sessionId: data.sessionId } : { error: data.error || 'Failed to initiate Stripe checkout' }; } catch (err:any) { return { error: err.message || 'Network error communicating with Stripe server' }; }
  },
  async verifySession(sessionId: string) {
    try { const res = await fetch('/api/stripe/verify-session', { method: 'POST', headers: await authHeaders(), body: JSON.stringify({ sessionId }) }); return await res.json(); } catch (err:any) { return { valid:false,error:err.message }; }
  },
  async openCustomerPortal(): Promise<string | null> {
    try { const res = await fetch('/api/stripe/customer-portal', { method:'POST', headers: await authHeaders(), body:'{}' }); const data=await res.json(); return data.url||null; } catch { return null; }
  },
};
