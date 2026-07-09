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
  const snap = await db.collection('courses').get();
  console.log(`\nTotal courses in Firestore: ${snap.size}\n`);
  snap.forEach(d => {
    const data = d.data();
    console.log(`  [${d.id}]`);
    console.log(`    title:    ${data.title}`);
    console.log(`    status:   ${data.status}`);
    console.log(`    category: ${data.category || '—'}`);
    console.log(`    level:    ${data.level || '—'}`);
    console.log(`    teacherId: ${data.teacherId}`);
  });
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
