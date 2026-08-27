import type { IncomingMessage, ServerResponse } from 'http';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(apiKey);
  }
  return stripeClient;
}

async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

export default async function handler(
  req: IncomingMessage & { url?: string; method?: string; query?: any },
  res: ServerResponse
) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  const rawUrl = req.url || '';

  // 1. Stripe Status Check
  if (rawUrl.includes('/status') || rawUrl.endsWith('/stripe')) {
    return sendJson(res, 200, {
      configured: !!process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    });
  }

  // 2. Create Checkout Session
  if (rawUrl.includes('/create-checkout-session')) {
    try {
      const stripe = getStripe();
      if (!stripe) {
        return sendJson(res, 400, {
          error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your Vercel Project Environment Variables.',
          isConfigured: false,
        });
      }

      const body = await parseBody(req);
      const {
        planId,
        userEmail,
        billingInterval = 'month',
        successUrl,
        cancelUrl,
        discountCode,
      } = body;

      let unitAmount = 900;
      let planTitle = 'OmniPDF Pro Subscription';
      let description = 'Unlimited in-browser PDF & Image processing, 500MB batch processing, and OCR';
      let interval: 'month' | 'year' = billingInterval === 'year' ? 'year' : 'month';

      if (planId === 'pro_annual' || (planId === 'pro' && billingInterval === 'year')) {
        unitAmount = 7900;
        planTitle = 'OmniPDF Pro Annual Subscription';
        interval = 'year';
      } else if (planId === 'team' || planId === 'team_monthly') {
        unitAmount = billingInterval === 'year' ? 18900 : 1900;
        planTitle = 'OmniPDF Team Workspace Subscription';
        description = 'Up to 10 team seats with shared workspace and centralized billing';
      } else if (planId === 'enterprise') {
        unitAmount = billingInterval === 'year' ? 46800 : 4900;
        planTitle = 'OmniPDF Enterprise Suite';
        description = 'Unlimited seats, dedicated SLA, token access & priority support';
      }

      if (discountCode && (discountCode.toUpperCase() === 'LAUNCH50' || discountCode.toUpperCase() === 'PRO50')) {
        unitAmount = Math.round(unitAmount * 0.5);
      }

      const origin =
        (req.headers['origin'] as string) ||
        (req.headers['referer'] ? new URL(req.headers['referer'] as string).origin : '') ||
        process.env.APP_URL ||
        'http://localhost:3000';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: userEmail || undefined,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: planTitle,
                description,
              },
              unit_amount: unitAmount,
              recurring: {
                interval,
              },
            },
            quantity: 1,
          },
        ],
        success_url:
          successUrl ||
          `${origin}/?payment_status=success&session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(planId || 'pro')}`,
        cancel_url: cancelUrl || `${origin}/?payment_status=cancelled`,
        metadata: {
          planId: planId || 'pro',
          userEmail: userEmail || '',
        },
      });

      return sendJson(res, 200, {
        sessionId: session.id,
        url: session.url,
      });
    } catch (err: any) {
      console.error('Vercel Stripe Checkout Error:', err);
      return sendJson(res, 500, { error: err.message || 'Failed to create checkout session' });
    }
  }

  // 3. Verify Checkout Session
  if (rawUrl.includes('/verify-session')) {
    try {
      const stripe = getStripe();
      if (!stripe) return sendJson(res, 400, { error: 'Stripe not configured' });

      const body = await parseBody(req);
      const { sessionId } = body;
      if (!sessionId) return sendJson(res, 400, { error: 'Session ID is required' });

      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['customer', 'subscription'],
      });

      return sendJson(res, 200, {
        valid: session.payment_status === 'paid' || session.status === 'complete',
        paymentStatus: session.payment_status,
        status: session.status,
        customerEmail: session.customer_details?.email || (session.customer as any)?.email,
      });
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message || 'Failed to verify session' });
    }
  }

  // 4. Customer Portal
  if (rawUrl.includes('/customer-portal')) {
    try {
      const stripe = getStripe();
      if (!stripe) return sendJson(res, 400, { error: 'Stripe not configured' });

      const body = await parseBody(req);
      const { customerId } = body;
      if (!customerId) return sendJson(res, 400, { error: 'Customer ID required' });

      const origin =
        (req.headers['origin'] as string) ||
        (req.headers['referer'] ? new URL(req.headers['referer'] as string).origin : '') ||
        'http://localhost:3000';

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/`,
      });

      return sendJson(res, 200, { url: portalSession.url });
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message || 'Failed to open customer portal' });
    }
  }

  // 5. Default Health check
  return sendJson(res, 200, {
    status: 'ok',
    service: 'OmniPDF Serverless API',
    timestamp: new Date().toISOString(),
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
  });
}
