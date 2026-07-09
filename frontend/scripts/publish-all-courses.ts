/**
 * One-time script: publish every course that isn't already published,
 * and backfill category/level if missing.
 *
 * Run from the frontend/ directory:
 *   npx tsx scripts/publish-all-courses.ts
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const serviceAccount = {
  projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID   || '',
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '',
  privateKey:  (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

if (getApps().length === 0) initializeApp({ credential: cert(serviceAccount as any) });
const db = getFirestore();

async function run() {
  const snap = await db.collection('courses').get();
  if (snap.empty) { console.log('No courses found.'); process.exit(0); }

  let published = 0, skipped = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const updates: Record<string, any> = {};

    if (data.status !== 'published') {
      updates.status = 'published';
    }

    // Backfill category if missing — guess from title keywords
    if (!data.category) {
      const t = (data.title || '').toLowerCase();
      if (t.includes('solidworks') || t.includes('cad'))          updates.category = 'SolidWorks';
      else if (t.includes('drone') || t.includes('uav'))          updates.category = 'Drones & UAV';
      else if (t.includes('arduino') || t.includes('embedded'))   updates.category = 'Embedded Systems';
      else if (t.includes('matlab') || t.includes('simulink'))    updates.category = 'MATLAB';
      else if (t.includes('mechatronics') || t.includes('robot')) updates.category = 'Mechatronics';
      else if (t.includes('automotive') || t.includes('obd'))     updates.category = 'Automotive';
      else                                                          updates.category = 'Other';
    }

    // Backfill level if missing
    if (!data.level) {
      updates.level = 'Beginner';
    }

    if (Object.keys(updates).length > 0) {
      await db.collection('courses').doc(docSnap.id).update(updates);
      console.log(`  ✅  "${data.title}" → published (was: ${data.status ?? 'unknown'})`);
      published++;
    } else {
      console.log(`  ⏭   "${data.title}" already published, skipped`);
      skipped++;
    }
  }

  console.log(`\n✔ Done — ${published} course(s) published, ${skipped} already live.`);
  process.exit(0);
}

run().catch(err => { console.error(err.message); process.exit(1); });
