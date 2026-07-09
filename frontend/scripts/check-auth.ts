import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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

const auth = getAuth();
const db   = getFirestore();

const emails = ['ceo@fusion8.com', 'teacher@fusion8.com', 'student@fusion8.com', 'developer@fusion8.com'];

async function run() {
  console.log('\n── Firebase Auth users ──────────────────────');
  for (const email of emails) {
    try {
      const user = await auth.getUserByEmail(email);
      console.log(`✅ ${email}`);
      console.log(`   uid: ${user.uid}`);
      console.log(`   disabled: ${user.disabled}`);
      console.log(`   emailVerified: ${user.emailVerified}`);
    } catch (e: any) {
      console.log(`❌ ${email} — ${e.message}`);
    }
  }

  console.log('\n── Firestore markers ────────────────────────');
  const teacherSnap = await db.collection('approved_teachers').doc('teacher-test-uid').get();
  console.log('approved_teachers/teacher-test-uid:', teacherSnap.exists ? '✅ exists' : '❌ missing');

  const emailSnap = await db.collection('approved_teacher_emails').doc('teacher@fusion8.com').get();
  console.log('approved_teacher_emails/teacher@fusion8.com:', emailSnap.exists ? '✅ exists' : '❌ missing');

  const adminSnap = await db.collection('roles_admin').doc('ceo-admin-test-uid').get();
  console.log('roles_admin/ceo-admin-test-uid:', adminSnap.exists ? '✅ exists' : '❌ missing');

  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
