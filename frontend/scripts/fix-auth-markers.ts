/**
 * Fixes Firestore role-markers so they match the real Firebase Auth UIDs.
 * Run: npx tsx scripts/fix-auth-markers.ts
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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

const USERS = [
  { email: 'ceo@fusion8.com',       role: 'admin',   displayName: 'Platform Admin' },
  { email: 'developer@fusion8.com',  role: 'admin',   displayName: 'Test Developer' },
  { email: 'teacher@fusion8.com',    role: 'teacher', displayName: 'Test Teacher'   },
  { email: 'student@fusion8.com',    role: 'student', displayName: 'Test Student'   },
];

async function run() {
  console.log('\n🔧 Fixing auth markers...\n');

  for (const u of USERS) {
    try {
      const record = await auth.getUserByEmail(u.email);
      const uid = record.uid;
      console.log(`${u.email}  →  uid: ${uid}`);

      // 1. Upsert the user profile with the correct uid
      await db.collection('users').doc(uid).set({
        id: uid,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        approved: true,
        emailVerified: true,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      // Also set emailVerified in Auth
      await auth.updateUser(uid, { emailVerified: true });

      // 2. Write the correct role-marker at the real UID
      if (u.role === 'admin') {
        await db.collection('roles_admin').doc(uid).set({ active: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        console.log(`  ✅ roles_admin/${uid}`);
      } else if (u.role === 'teacher') {
        await db.collection('approved_teachers').doc(uid).set({ active: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        await db.collection('approved_teacher_emails').doc(u.email).set({ active: true, addedAt: FieldValue.serverTimestamp() }, { merge: true });
        console.log(`  ✅ approved_teachers/${uid}`);
        console.log(`  ✅ approved_teacher_emails/${u.email}`);
      }

    } catch (e: any) {
      console.error(`  ❌ ${u.email}: ${e.message}`);
    }
  }

  console.log('\n✔ Done. All role markers are now aligned with real Firebase Auth UIDs.');
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
