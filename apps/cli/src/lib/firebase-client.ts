import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;
let db: admin.firestore.Firestore | null = null;

const AUTH_ERROR_MESSAGE = 'Run invoiceapp login first or set FIREBASE_SERVICE_ACCOUNT env var';

export function initFirebase(): void {
  if (app) return;

  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      const serviceAccountJson = JSON.parse(serviceAccount);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountJson),
      });
    } else {
      app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
    db = app.firestore();
  } catch (error) {
    console.error(AUTH_ERROR_MESSAGE);
    throw new Error(AUTH_ERROR_MESSAGE);
  }
}

export function getDb(): admin.firestore.Firestore {
  if (!db) {
    initFirebase();
  }
  return db!;
}

export { admin };

export function getUserDoc(userId: string): admin.firestore.DocumentReference {
  return getDb().collection('users').doc(userId);
}

export async function writeDoc(
  collection: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  await getDb().collection(collection).doc(docId).set(data, { merge: true });
}

export async function setDoc(
  collection: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  await getDb().collection(collection).doc(docId).set(data);
}
