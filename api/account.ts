import type { IncomingMessage, ServerResponse } from 'http';
import { FieldValue } from 'firebase-admin/firestore';
import { ensureUser, getFirebaseAdmin, requireFirebaseUser } from './_firebaseAdmin';

function json(res: ServerResponse, status: number, data: unknown) { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(data)); }

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const decoded = await requireFirebaseUser(req);
    const ref = await ensureUser(decoded.uid, decoded.email || '', decoded.name || '');
    const { db } = getFirebaseAdmin();
    if (req.method === 'GET') {
      const snap = await ref.get();
      const data = snap.data() || {};
      return json(res, 200, { uid: decoded.uid, email: decoded.email || '', name: decoded.name || '', role: data.role || 'free', credits: Number(data.credits || 0), subscriptionStatus: data.subscriptionStatus || 'inactive' });
    }
    if (req.method === 'DELETE') {
      await db.collection('audit').add({ uid: decoded.uid, type: 'account.deleted', createdAt: FieldValue.serverTimestamp() });
      await ref.delete();
      await getFirebaseAdmin().auth.deleteUser(decoded.uid);
      return json(res, 200, { deleted: true });
    }
    return json(res, 405, { error: 'Method not allowed' });
  } catch (error: any) { return json(res, error.message === 'UNAUTHORIZED' ? 401 : 500, { error: error.message === 'UNAUTHORIZED' ? 'Authentication required' : 'Account service error' }); }
}
