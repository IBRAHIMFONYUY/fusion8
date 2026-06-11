import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "fusion81-77505965-97563",
  appId: "1:966832271210:web:488d35bd2223da3066ff13",
  apiKey: "AIzaSyBm6YZMMhm6oh2PfXfqlc1C46AvK7AgDIM",
  authDomain: "fusion81-77505965-97563.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    console.log("Fetching blog_posts...");
    const snapshot = await getDocs(collection(db, 'blog_posts'));
    console.log(`Success! Found ${snapshot.size} posts.`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

test();
