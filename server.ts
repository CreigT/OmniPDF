import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(apiKey);
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parsing
  app.use(express.json());

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    });
  });

  // Stripe Configuration Status
  app.get('/api/stripe/status', (req, res) => {
    res.json({
      configured: !!process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    });
  });

  // Create Stripe Checkout Session for SaaS Subscriptions
  app.post('/api/stripe/create-checkout-session', async (req, res) => {
    try {
      const stripe = getStripe();
      if (!stripe) {
        return res.status(400).json({
          error: 'Stripe is not configured on this server. Please ensure STRIPE_SECRET_KEY is set in environment secrets.',
          isConfigured: false,
        });
      }

      const {
        planId,
        userEmail,
        billingInterval = 'month',
        successUrl,
        cancelUrl,
        discountCode,
      } = req.body;

      // Determine pricing parameters based on plan
      let unitAmount = 900; // in cents ($9.00)
      let planTitle = 'OmniPDF Pro Subscription';
      let description = 'Unlimited in-browser PDF & Image processing, 500MB batch processing, and OCR';
      let interval: 'month' | 'year' = billingInterval === 'year' ? 'year' : 'month';

      if (planId === 'pro_annual' || (planId === 'pro' && billingInterval === 'year')) {
        unitAmount = 7900; // $79.00/yr (with discount applied if valid)
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

      // Apply coupon discount if provided
      if (discountCode && (discountCode.toUpperCase() === 'LAUNCH50' || discountCode.toUpperCase() === 'PRO50')) {
        unitAmount = Math.round(unitAmount * 0.5);
      }

      // Determine origin for redirect URLs
      const origin =
        req.headers.origin ||
        (req.headers.referer ? new URL(req.headers.referer).origin : '') ||
        process.env.APP_URL ||
        `http://localhost:${PORT}`;

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
                images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80'],
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
          `${origin}/?payment_status=success&session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(planId)}`,
        cancel_url: cancelUrl || `${origin}/?payment_status=cancelled`,
        metadata: {
          planId: planId || 'pro',
          userEmail: userEmail || '',
        },
      });

      return res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (err: any) {
      console.error('Error creating Stripe checkout session:', err);
      return res.status(500).json({
        error: err.message || 'Failed to create checkout session with Stripe',
      });
    }
  });

  // Verify Checkout Session & Retrieve Subscription status
  app.post('/api/stripe/verify-session', async (req, res) => {
    try {
      const stripe = getStripe();
      if (!stripe) {
        return res.status(400).json({ error: 'Stripe not configured' });
      }

      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['customer', 'subscription', 'line_items'],
      });

      return res.json({
        valid: session.payment_status === 'paid' || session.status === 'complete',
        paymentStatus: session.payment_status,
        status: session.status,
        customerEmail: session.customer_details?.email || (session.customer as any)?.email,
        customerId: typeof session.customer === 'string' ? session.customer : (session.customer as any)?.id,
        subscriptionId:
          typeof session.subscription === 'string'
            ? session.subscription
            : (session.subscription as any)?.id,
        metadata: session.metadata,
        amountTotal: session.amount_total ? session.amount_total / 100 : 0,
      });
    } catch (err: any) {
      console.error('Error verifying Stripe session:', err);
      return res.status(500).json({ error: err.message || 'Failed to verify session' });
    }
  });

  // Create Stripe Customer Billing Portal Session
  app.post('/api/stripe/customer-portal', async (req, res) => {
    try {
      const stripe = getStripe();
      if (!stripe) {
        return res.status(400).json({ error: 'Stripe not configured' });
      }

      const { customerId } = req.body;
      if (!customerId) {
        return res.status(400).json({ error: 'Stripe Customer ID is required for Billing Portal access' });
      }

      const origin =
        req.headers.origin ||
        (req.headers.referer ? new URL(req.headers.referer).origin : '') ||
        process.env.APP_URL ||
        `http://localhost:${PORT}`;

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/`,
      });

      return res.json({ url: portalSession.url });
    } catch (err: any) {
      console.error('Error creating Stripe billing portal session:', err);
      return res.status(500).json({ error: err.message || 'Failed to open billing portal' });
    }
  });

  // --- VITE MIDDLEWARE & STATIC ASSET HANDLING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OmniPDF Full-Stack Server running at http://localhost:${PORT}`);
    console.log(`Stripe integration status: ${process.env.STRIPE_SECRET_KEY ? 'Active (Live)' : 'Standby (Awaiting STRIPE_SECRET_KEY)'}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
