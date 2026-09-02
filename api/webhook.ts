import type { IncomingMessage, ServerResponse } from 'http';
import Stripe from 'stripe';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from './_firebaseAdmin';

async function rawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method not allowed'); }
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secretKey || !webhookSecret) throw new Error('Stripe webhook is not configured.');
    const stripe = new Stripe(secretKey);
    const signature = req.headers['stripe-signature'];
    if (!signature || Array.isArray(signature)) throw new Error('Missing Stripe signature.');
    const event = stripe.webhooks.constructEvent(await rawBody(req), signature, webhookSecret);
    const { db } = getFirebaseAdmin();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.client_reference_id || session.metadata?.uid;
      if (uid) {
        const planId = session.metadata?.planId || '';
        const credits = Number(session.metadata?.credits || 0);
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || null;
        const update: Record<string, unknown> = { stripeCustomerId: customerId, updatedAt: FieldValue.serverTimestamp() };
        if (credits > 0) update.credits = FieldValue.increment(credits);
        if (planId === 'pro') { update.role = 'pro'; update.subscriptionStatus = 'active'; update.stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null; }
        await db.collection('users').doc(uid).set(update, { merge: true });
        await db.collection('audit').add({ uid, type: 'checkout.session.completed', stripeEventId: event.id, planId, credits, createdAt: FieldValue.serverTimestamp() });
      }
    }

    if (['customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
      const matches = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
      if (!matches.empty) {
        const active = ['active', 'trialing'].includes(subscription.status);
        await matches.docs[0].ref.set({ role: active ? 'pro' : 'free', subscriptionStatus: subscription.status, stripeSubscriptionId: subscription.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        const matches = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
        if (!matches.empty) await matches.docs[0].ref.set({ subscriptionStatus: 'past_due', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
    }

    res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ received: true }));
  } catch (error: any) {
    res.statusCode = 400; res.end(`Webhook Error: ${error.message}`);
  }
}
