import type { IncomingMessage, ServerResponse } from 'http';
import Stripe from 'stripe';
import crypto from 'crypto';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) return null;
  if (!stripeClient) stripeClient = new Stripe(apiKey);
  return stripeClient;
}

async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { resolve({}); }
    });
  });
}

function sendJson(res: ServerResponse, status: number, data: any, extraHeaders: Record<string, string> = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...extraHeaders,
  });
  res.end(JSON.stringify(data));
}

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function signAdminSession(email: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;
  const expires = Date.now() + 8 * 60 * 60 * 1000;
  const payload = `${email}|${expires}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}|${sig}`).toString('base64url');
}

function verifyAdminSession(req: IncomingMessage) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/(?:^|;\s*)omnypdf_admin=([^;]+)/);
  if (!match) return false;
  try {
    const decoded = Buffer.from(match[1], 'base64url').toString('utf8');
    const [email, expiresRaw, sig] = decoded.split('|');
    if (!email || !expiresRaw || !sig || Number(expiresRaw) < Date.now()) return false;
    const payload = `${email}|${expiresRaw}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return safeEqual(sig, expected);
  } catch {
    return false;
  }
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

  // Admin authentication — credentials exist only in Vercel environment variables.
  if (rawUrl.includes('/admin/login')) {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
    const configuredEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const configuredPassword = process.env.ADMIN_PASSWORD || '';
    const sessionSecret = process.env.ADMIN_SESSION_SECRET || '';
    if (!configuredEmail || !configuredPassword || !sessionSecret) {
      return sendJson(res, 503, { error: 'Admin authentication is not configured.' });
    }
    const body = await parseBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!safeEqual(email, configuredEmail) || !safeEqual(password, configuredPassword)) {
      return sendJson(res, 401, { error: 'Invalid administrator credentials.' });
    }
    const token = signAdminSession(email);
    if (!token) return sendJson(res, 500, { error: 'Unable to create admin session.' });
    return sendJson(res, 200, { success: true }, {
      'Set-Cookie': `omnypdf_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`,
      'Cache-Control': 'no-store',
    });
  }

  if (rawUrl.includes('/admin/session')) {
    return sendJson(res, verifyAdminSession(req) ? 200 : 401, { authenticated: verifyAdminSession(req) }, {
      'Cache-Control': 'no-store',
    });
  }

  if (rawUrl.includes('/admin/logout')) {
    return sendJson(res, 200, { success: true }, {
      'Set-Cookie': 'omnypdf_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
      'Cache-Control': 'no-store',
    });
  }

  if (rawUrl.includes('/status') || rawUrl.endsWith('/stripe')) {
    return sendJson(res, 200, {
      configured: !!process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    });
  }

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
      const { planId, userEmail, billingInterval = 'month', successUrl, cancelUrl, discountCode } = body;

      let unitAmount = 900;
      let planTitle = 'OmniPDF Pro Subscription';
      let description = 'Unlimited daily uses and support for larger files up to 500 MB.';
      let interval: 'month' | 'year' = billingInterval === 'year' ? 'year' : 'month';

      if (planId === 'pro_annual' || (planId === 'pro' && billingInterval === 'year')) {
        unitAmount = 7900;
        planTitle = 'OmniPDF Pro Annual Subscription';
        interval = 'year';
      } else if (planId === 'team' || planId === 'team_monthly') {
        unitAmount = billingInterval === 'year' ? 18900 : 1900;
        planTitle = 'OmniPDF Team Subscription';
        description = 'Shared access for small teams.';
      } else if (planId === 'enterprise') {
        unitAmount = billingInterval === 'year' ? 46800 : 4900;
        planTitle = 'OmniPDF Enterprise Subscription';
        description = 'Expanded access for larger organizations.';
      }

      if (discountCode && (discountCode.toUpperCase() === 'LAUNCH50' || discountCode.toUpperCase() === 'PRO50')) {
        unitAmount = Math.round(unitAmount * 0.5);
      }

      const configuredAppUrl = (process.env.APP_URL || '').replace(/\/$/, '');
      const requestOrigin =
        (req.headers['origin'] as string) ||
        (req.headers['referer'] ? new URL(req.headers['referer'] as string).origin : '') ||
        'http://localhost:3000';
      const origin = configuredAppUrl || requestOrigin;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: userEmail || undefined,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: planTitle, description },
            unit_amount: unitAmount,
            recurring: { interval },
          },
          quantity: 1,
        }],
        success_url: successUrl || `${origin}/?payment_status=success&session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(planId || 'pro')}`,
        cancel_url: cancelUrl || `${origin}/?payment_status=cancelled`,
        metadata: { planId: planId || 'pro', userEmail: userEmail || '' },
      });

      return sendJson(res, 200, { sessionId: session.id, url: session.url });
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message || 'Failed to create checkout session' });
    }
  }

  if (rawUrl.includes('/verify-session')) {
    try {
      const stripe = getStripe();
      if (!stripe) return sendJson(res, 400, { error: 'Stripe not configured' });
      const body = await parseBody(req);
      const { sessionId } = body;
      if (!sessionId) return sendJson(res, 400, { error: 'Session ID is required' });
      const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['customer', 'subscription'] });
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

  if (rawUrl.includes('/customer-portal')) {
    try {
      const stripe = getStripe();
      if (!stripe) return sendJson(res, 400, { error: 'Stripe not configured' });
      const body = await parseBody(req);
      const { customerId } = body;
      if (!customerId) return sendJson(res, 400, { error: 'Customer ID required' });
      const configuredAppUrl = (process.env.APP_URL || '').replace(/\/$/, '');
      const requestOrigin =
        (req.headers['origin'] as string) ||
        (req.headers['referer'] ? new URL(req.headers['referer'] as string).origin : '') ||
        'http://localhost:3000';
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${configuredAppUrl || requestOrigin}/`,
      });
      return sendJson(res, 200, { url: portalSession.url });
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message || 'Failed to open customer portal' });
    }
  }

  return sendJson(res, 200, {
    status: 'ok',
    service: 'OmniPDF Serverless API',
    timestamp: new Date().toISOString(),
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    adminAuthConfigured: !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET),
  });
}
