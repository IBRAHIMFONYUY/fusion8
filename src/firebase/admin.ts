
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let serviceAccount: any;
try {
  const privateKeyValue = process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';
  if (privateKeyValue.trim().startsWith('{')) {
    // If the .env contains the complete JSON service account object
    serviceAccount = JSON.parse(privateKeyValue);
  } else {
    // Standard discrete environment variables
    serviceAccount = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKeyValue.replace(/\\n/g, '\n'),
    };
  }
} catch (error) {
  console.error("Firebase Admin Initialization Error: Failed to parse credentials.", error);
}

export function getAdminApp(): App {
  if (getApps().length === 0) {
    return initializeApp({
      credential: cert(serviceAccount),
    });
  }
  return getApps()[0];
}

export const adminAuth = getAuth(getAdminApp());
export const adminDb = getFirestore(getAdminApp());
