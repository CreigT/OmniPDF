import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import type { IncomingMessage } from 'http';

function privateKey() { return (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'); }

export function getFirebaseAdmin() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const key = privateKey();
    if (!projectId || !clientEmail || !key) throw new Error('Firebase Admin is not configured.');
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey: key }) });
  }
  return { auth: getAuth(), db: getFirestore() };
}

export async function requireFirebaseUser(req: IncomingMessage) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new Error('UNAUTHORIZED');
  const token = header.slice(7);
  const { auth } = getFirebaseAdmin();
  return auth.verifyIdToken(token, true);
}

export async function ensureUser(uid: string, email = '', name = '') {
  const { db } = getFirebaseAdmin();
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({ uid, email, name, role: 'free', credits: 0, subscriptionStatus: 'inactive', stripeCustomerId: null, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  } else {
    await ref.set({ email, name, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
  return ref;
}
