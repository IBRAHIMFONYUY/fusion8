import { config } from 'dotenv';
import { resolve } from 'path';

// Load env files — .env.local takes precedence over .env
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const SEED_PASSWORD = 'password';

const usersToSeed = [
  {
    email: 'ceo@fusion8.com',
    displayName: 'Platform Admin',
    role: 'admin',
    uid: 'ceo-admin-test-uid',
    approved: true
  },
  {
    email: 'developer@fusion8.com',
    displayName: 'Test Developer',
    role: 'admin',
    uid: 'developer-admin-test-uid',
    approved: true
  },
  {
    email: 'teacher@fusion8.com',
    displayName: 'Test Teacher',
    role: 'teacher',
    uid: 'teacher-test-uid',
    approved: true
  },
  {
    email: 'student@fusion8.com',
    displayName: 'Test Student',
    role: 'student',
    uid: 'student-test-uid',
    approved: true
  }
];

async function seedUsers() {
  console.log('🌱 Starting Database Seeding...');

  if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    console.error('❌ Error: FIREBASE_ADMIN_PRIVATE_KEY is missing in .env');
    console.error('Make sure you have copied .env.example to .env and filled it out.');
    process.exit(1);
  }

  const { adminAuth, adminDb: adminFirestore } = await import('../src/firebase/admin');

  for (const userData of usersToSeed) {
    try {
      console.log(`\nProcessing user: ${userData.email}`);
      
      let userRecord;
      try {
        userRecord = await adminAuth.getUserByEmail(userData.email);
        console.log(`  - User already exists in Auth. Updating password to '${SEED_PASSWORD}'...`);
        await adminAuth.updateUser(userRecord.uid, { password: SEED_PASSWORD });
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          console.log(`  - Creating new Auth user...`);
          userRecord = await adminAuth.createUser({
            uid: userData.uid,
            email: userData.email,
            password: SEED_PASSWORD,
            displayName: userData.displayName,
            emailVerified: true
          });
        } else {
          throw err;
        }
      }

      const uid = userRecord.uid;

      console.log(`  - Upserting Firestore profile...`);
      const profile = {
        id: uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        approved: userData.approved,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
        createdAt: FieldValue.serverTimestamp()
      };

      await adminFirestore.collection('users').doc(uid).set(profile, { merge: true });

      // Add security markers
      if (userData.role === 'admin') {
        await adminFirestore.collection('roles_admin').doc(uid).set({ active: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      } else if (userData.role === 'teacher') {
        await adminFirestore.collection('approved_teachers').doc(uid).set({ active: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        // Approved teacher emails marker
        await adminFirestore.collection('approved_teacher_emails').doc(userData.email).set({ active: true, addedAt: FieldValue.serverTimestamp() }, { merge: true });
      }

      console.log(`✅ Successfully seeded: ${userData.email}`);
    } catch (error) {
      console.error(`❌ Failed to seed ${userData.email}:`, error);
    }
  }

  console.log('\n🎉 Seeding complete! You can now log in with the above emails and password "password".');
  process.exit(0);
}

seedUsers().catch(console.error);
