export const firebaseConfig = {
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? 'fusion81-77505965-97563',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID              ?? '1:966832271210:web:488d35bd2223da3066ff13',
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY             ?? 'AIzaSyBm6YZMMhm6oh2PfXfqlc1C46AvK7AgDIM',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN         ?? 'fusion81-77505965-97563.firebaseapp.com',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET      ?? 'fusion81-77505965-97563.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '966832271210',
  measurementId:     '',
};
