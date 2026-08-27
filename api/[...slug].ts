import type { IncomingMessage, ServerResponse } from 'http';
import Stripe from 'stripe';
import crypto from 'crypto';

let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null { const apiKey = process.env.STRIPE_SECRET_KEY; if (!apiKey) return null; if (!stripeClient) stripeClient = new Stripe(apiKey); return stripeClient; }
async function parseBody(req: IncomingMessage): Promise<any> { return new Promise((resolve) => { let body = ''; req.on('data', (chunk) => { body += chunk.toString(); }); req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { resolve({}); } }); }); }
function sendJson(res: ServerResponse, status: number, data: any, extraHeaders: Record<string, string> = {}) { res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', ...extraHeaders }); res.end(JSON.stringify(data)); }
function safeEqual(a: string, b: string) { const aa = Buffer.from(a); const bb = Buffer.from(b); return aa.length === bb.length && crypto.timingSafeEqual(aa, bb); }
function signAdminSession(email: string) { const secret = process.env.ADMIN_SESSION_SECRET; if (!secret) return null; const expires = Date.now() + 8 * 60 * 60 * 1000; const payload = `${email}|${expires}`; const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex'); return Buffer.from(`${payload}|${sig}`).toString('base64url'); }
function verifyAdminSession(req: IncomingMessage) { const secret = process.env.ADMIN_SESSION_SECRET; if (!secret) return false; const match = (req.headers.cookie || '').match(/(?:^|;\s*)omnypdf_admin=([^;]+)/); if (!match) return false; try { const [email, expiresRaw, sig] = Buffer.from(match[1], 'base64url').toString('utf8').split('|'); if (!email || !expiresRaw || !sig || Number(expiresRaw) < Date.now()) return false; const expected = crypto.createHmac('sha256', secret).update(`${email}|${expiresRaw}`).digest('hex'); return safeEqual(sig, expected); } catch { return false; } }

export default async function handler(req: IncomingMessage & { url?: string; method?: string }, res: ServerResponse) {
  if (req.method === 'OPTIONS') { res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }); res.end(); return; }
  const rawUrl = req.url || '';

  if (rawUrl.includes('/admin/login')) {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
    const configuredEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase(); const configuredPassword = process.env.ADMIN_PASSWORD || ''; const sessionSecret = process.env.ADMIN_SESSION_SECRET || '';
    if (!configuredEmail || !configuredPassword || !sessionSecret) return sendJson(res, 503, { error: 'Admin authentication is not configured.' });
    const body = await parseBody(req); const email = String(body.email || '').trim().toLowerCase(); const password = String(body.password || '');
    if (!safeEqual(email, configuredEmail) || !safeEqual(password, configuredPassword)) return sendJson(res, 401, { error: 'Invalid administrator credentials.' });
    const token = signAdminSession(email); if (!token) return sendJson(res, 500, { error: 'Unable to create admin session.' });
    return sendJson(res, 200, { success: true }, { 'Set-Cookie': `omnypdf_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`, 'Cache-Control': 'no-store' });
  }
  if (rawUrl.includes('/admin/session')) return sendJson(res, verifyAdminSession(req) ? 200 : 401, { authenticated: verifyAdminSession(req) }, { 'Cache-Control': 'no-store' });
  if (rawUrl.includes('/admin/logout')) return sendJson(res, 200, { success: true }, { 'Set-Cookie': 'omnypdf_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0', 'Cache-Control': 'no-store' });

  if (rawUrl.includes('/status') || rawUrl.endsWith('/stripe')) return sendJson(res, 200, { configured: !!process.env.STRIPE_SECRET_KEY, publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '' });

  if (rawUrl.includes('/create-checkout-session')) {
    try {
      const stripe = getStripe();
      if (!stripe) return sendJson(res, 400, { error: 'Payments are not connected yet.', isConfigured: false });
      const body = await parseBody(req); const planId = String(body.planId || 'single_use'); const userEmail = body.userEmail;
      const products: Record<string, { amount: number; title: string; description: string; mode: 'payment' | 'subscription'; credits?: number }> = {
        single_use: { amount: 149, title: 'OmniPDF Pay Once', description: 'One premium OmniPDF use. No subscription.', mode: 'payment', credits: 1 },
        credits_10: { amount: 499, title: 'OmniPDF 10 Credit Pack', description: 'Ten premium OmniPDF uses. No subscription.', mode: 'payment', credits: 10 },
        credits_30: { amount: 999, title: 'OmniPDF 30 Credit Pack', description: 'Thirty premium OmniPDF uses. No subscription.', mode: 'payment', credits: 30 },
        pro: { amount: 900, title: 'OmniPDF Pro Unlimited', description: 'Unlimited daily uses and larger files up to 500 MB.', mode: 'subscription' },
      };
      const product = products[planId]; if (!product) return sendJson(res, 400, { error: 'Unknown purchase option.' });
      const configuredAppUrl = (process.env.APP_URL || '').replace(/\/$/, '');
      const requestOrigin = (req.headers['origin'] as string) || (req.headers['referer'] ? new URL(req.headers['referer'] as string).origin : '') || 'http://localhost:3000'; const origin = configuredAppUrl || requestOrigin;
      const priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData = { currency: 'usd', product_data: { name: product.title, description: product.description }, unit_amount: product.amount };
      if (product.mode === 'subscription') priceData.recurring = { interval: 'month' };
      const session = await stripe.checkout.sessions.create({ payment_method_types: ['card'], mode: product.mode, customer_email: userEmail || undefined, line_items: [{ price_data: priceData, quantity: 1 }], success_url: `${origin}/?payment_status=success&session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(planId)}`, cancel_url: `${origin}/?payment_status=cancelled`, metadata: { planId, credits: String(product.credits || 0), userEmail: userEmail || '' } });
      return sendJson(res, 200, { sessionId: session.id, url: session.url });
    } catch (err: any) { return sendJson(res, 500, { error: err.message || 'Failed to create checkout session' }); }
  }

  if (rawUrl.includes('/verify-session')) {
    try {
      const stripe = getStripe(); if (!stripe) return sendJson(res, 400, { error: 'Stripe not configured' }); const body = await parseBody(req); if (!body.sessionId) return sendJson(res, 400, { error: 'Session ID is required' });
      const session = await stripe.checkout.sessions.retrieve(body.sessionId, { expand: ['customer', 'subscription'] });
      return sendJson(res, 200, { valid: session.payment_status === 'paid' || session.status === 'complete', paymentStatus: session.payment_status, status: session.status, planId: session.metadata?.planId || '', credits: Number(session.metadata?.credits || 0), customerEmail: session.customer_details?.email || (session.customer as any)?.email });
    } catch (err: any) { return sendJson(res, 500, { error: err.message || 'Failed to verify session' }); }
  }

  if (rawUrl.includes('/customer-portal')) {
    try { const stripe = getStripe(); if (!stripe) return sendJson(res, 400, { error: 'Stripe not configured' }); const body = await parseBody(req); if (!body.customerId) return sendJson(res, 400, { error: 'Customer ID required' }); const configuredAppUrl = (process.env.APP_URL || '').replace(/\/$/, ''); const requestOrigin = (req.headers['origin'] as string) || (req.headers['referer'] ? new URL(req.headers['referer'] as string).origin : '') || 'http://localhost:3000'; const portalSession = await stripe.billingPortal.sessions.create({ customer: body.customerId, return_url: `${configuredAppUrl || requestOrigin}/` }); return sendJson(res, 200, { url: portalSession.url }); } catch (err: any) { return sendJson(res, 500, { error: err.message || 'Failed to open customer portal' }); }
  }

  return sendJson(res, 200, { status: 'ok', service: 'OmniPDF Serverless API', timestamp: new Date().toISOString(), stripeConfigured: !!process.env.STRIPE_SECRET_KEY, adminAuthConfigured: !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET) });
}
