import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

const firebaseConfig = {
  projectId: "fusion81-77505965-97563",
  appId: "1:966832271210:web:488d35bd2223da3066ff13",
  apiKey: "AIzaSyBm6YZMMhm6oh2PfXfqlc1C46AvK7AgDIM",
  authDomain: "fusion81-77505965-97563.firebaseapp.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    const cred = await signInWithEmailAndPassword(auth, "ceo@fusion8.com", "password123");
    console.log("Logged in UID:", cred.user.uid);

    const q = query(
      collection(db, 'notifications'),
      where('global', '==', true),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    console.log("Waiting for index to build...");
    let retries = 60;
    while (retries > 0) {
      try {
        const snap = await getDocs(q);
        console.log("Success! Found", snap.size, "documents.");
        break;
      } catch (e) {
        if (e.message && e.message.includes("requires an index")) {
          console.log("Index not ready yet, waiting 5 seconds...");
          await new Promise(r => setTimeout(r, 5000));
          retries--;
        } else {
          throw e;
        }
      }
    }
    
  } catch (e) {
    console.error("Firebase Error:", e.name, e.code, e.message);
  }
  process.exit(0);
}

run();
