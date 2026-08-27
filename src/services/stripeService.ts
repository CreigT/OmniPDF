export type OmniPlanId = 'single_use' | 'credits_10' | 'credits_30' | 'pro';

export interface StripeCheckoutOptions {
  planId: OmniPlanId;
  userEmail?: string;
}

export interface StripeStatus {
  configured: boolean;
  publishableKey?: string;
}

export const stripeService = {
  async getStatus(): Promise<StripeStatus> {
    try {
      const res = await fetch('/api/stripe/status');
      if (!res.ok) return { configured: false };
      return await res.json();
    } catch {
      return { configured: false };
    }
  },

  async createCheckoutSession(options: StripeCheckoutOptions): Promise<{ url?: string; sessionId?: string; error?: string }> {
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Failed to initiate Stripe checkout' };
      return { url: data.url, sessionId: data.sessionId };
    } catch (err: any) {
      return { error: err.message || 'Network error communicating with Stripe server' };
    }
  },

  async verifySession(sessionId: string) {
    try {
      const res = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      return await res.json();
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  },

  async openCustomerPortal(customerId: string): Promise<string | null> {
    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
      const data = await res.json();
      return data.url || null;
    } catch {
      return null;
    }
  },
};
