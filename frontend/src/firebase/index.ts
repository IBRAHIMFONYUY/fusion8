'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

/**
 * @fileOverview Production-grade Firebase Initialization
 * Implements a singleton pattern to prevent multiple app instances.
 */

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

// App Check debug token — set BEFORE initializeApp so Firebase intercepts it.
// In development: Firebase auto-generates a debug token (printed to console).
// Register that token once in Firebase Console → App Check → Apps → Add debug token.
// In production: set NEXT_PUBLIC_RECAPTCHA_SITE_KEY to enable reCAPTCHA v3.
if (typeof self !== 'undefined' && process.env.NODE_ENV === 'development') {
  const preRegisteredDebugToken = process.env.NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN;
  (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = preRegisteredDebugToken || true;
}

// Ensure initialization only happens once
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize App Check when reCAPTCHA key is provided (production).
// In development the debug token flag above handles it automatically.
if (typeof window !== 'undefined') {
  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (recaptchaKey) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch {
      // Already initialized on hot reload — safe to ignore.
    }
  }
}

auth = getAuth(app);
firestore = getFirestore(app);
storage = getStorage(app);

// Direct exports for cleaner imports in components
export { app, auth, firestore, storage };

export function initializeFirebase() {
  return { firebaseApp: app, auth, firestore, storage };
}

// Re-export provider and hooks
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
