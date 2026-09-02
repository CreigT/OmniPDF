import type { IncomingMessage, ServerResponse } from 'http';
import { FieldValue } from 'firebase-admin/firestore';
import { ensureUser, getFirebaseAdmin, requireFirebaseUser } from './_firebaseAdmin';

function json(res: ServerResponse, status: number, data: unknown) { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(data)); }
function dayKey() { return new Date().toISOString().slice(0, 10); }

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const decoded = await requireFirebaseUser(req);
    const userRef = await ensureUser(decoded.uid, decoded.email || '', decoded.name || '');
    const { db } = getFirebaseAdmin();
    const result = await db.runTransaction(async tx => {
      const userSnap = await tx.get(userRef); const user = userSnap.data() || {};
      if (user.role === 'pro' && user.subscriptionStatus === 'active') return { allowed: true, unlimited: true, credits: Number(user.credits || 0) };
      const credits = Number(user.credits || 0);
      if (credits > 0) { tx.update(userRef, { credits: FieldValue.increment(-1), updatedAt: FieldValue.serverTimestamp() }); return { allowed: true, unlimited: false, credits: credits - 1, source: 'credit' }; }
      const usageRef = userRef.collection('dailyUsage').doc(dayKey());
      const usageSnap = await tx.get(usageRef); const count = Number(usageSnap.data()?.count || 0); const limit = 3;
      if (count >= limit) return { allowed: false, unlimited: false, credits: 0, remaining: 0, reason: 'Daily free limit reached.' };
      tx.set(usageRef, { count: count + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return { allowed: true, unlimited: false, credits: 0, remaining: limit - count - 1, source: 'free' };
    });
    return json(res, result.allowed ? 200 : 429, result);
  } catch (error: any) { return json(res, error.message === 'UNAUTHORIZED' ? 401 : 500, { error: error.message === 'UNAUTHORIZED' ? 'Authentication required' : 'Usage service error' }); }
}
