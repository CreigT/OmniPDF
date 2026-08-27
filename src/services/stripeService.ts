export interface StripeCheckoutOptions {
  planId: 'pro' | 'pro_annual' | 'team' | 'team_monthly' | 'enterprise';
  billingInterval?: 'month' | 'year';
  userEmail?: string;
  discountCode?: string;
}

export interface StripeStatus {
  configured: boolean;
  publishableKey?: string;
}

export const stripeService = {
  // Check if live Stripe backend is configured
  async getStatus(): Promise<StripeStatus> {
    try {
      const res = await fetch('/api/stripe/status');
      if (!res.ok) return { configured: false };
      return await res.json();
    } catch {
      return { configured: false };
    }
  },

  // Create Stripe Checkout Session & return URL
  async createCheckoutSession(options: StripeCheckoutOptions): Promise<{ url?: string; sessionId?: string; error?: string }> {
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Failed to initiate Stripe checkout' };
      }
      return { url: data.url, sessionId: data.sessionId };
    } catch (err: any) {
      return { error: err.message || 'Network error communicating with Stripe server' };
    }
  },

  // Verify a session after returning from Stripe checkout
  async verifySession(sessionId: string) {
    try {
      const res = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      return await res.json();
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  },

  // Open Stripe customer billing portal for self-service subscription management
  async openCustomerPortal(customerId: string): Promise<string | null> {
    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId }),
      });
      const data = await res.json();
      return data.url || null;
    } catch {
      return null;
    }
  },
};
