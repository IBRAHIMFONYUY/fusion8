import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
const sa = {
  projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID   || '',
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '',
  privateKey:  (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};
if (getApps().length === 0) initializeApp({ credential: cert(sa as any) });
const db = getFirestore();

async function run() {
  // CEO (actual uid from .env.local)
  const ceoUid = 'x8rM4ioT6jTMU0rEfy2ujMQ0sFy1';
  const ceoMarker = await db.collection('roles_admin').doc(ceoUid).get();
  const ceoProfile = await db.collection('users').doc(ceoUid).get();
  console.log(`CEO    | roles_admin: ${ceoMarker.exists ? '✅' : '❌'} | users.role: ${ceoProfile.data()?.role ?? '❌'}`);

  // Teacher (actual uid from Firebase Auth)
  const teacherUid = 'LowVpWbbb7Y74UbHshaAS6bHA8g1';
  const teacherMarker = await db.collection('approved_teachers').doc(teacherUid).get();
  const teacherProfile = await db.collection('users').doc(teacherUid).get();
  console.log(`Teacher| approved_teachers: ${teacherMarker.exists ? '✅' : '❌'} | users.role: ${teacherProfile.data()?.role ?? '❌'}`);

  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
