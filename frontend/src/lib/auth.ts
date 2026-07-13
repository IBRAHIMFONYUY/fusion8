'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  AuthError,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '@/firebase';
import { createSession, destroySession } from '@/lib/auth-actions';
import { isCEO as isCEOShared } from '@/lib/ceo';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: any;
  lastLogin: any;
  accountType: 'email' | 'google';
  onboardingCompleted: boolean;
  photoURL?: string;
  approved?: boolean;
  matricule?: string;
  mentorId?: string;
  mentorName?: string;
}

// These are loaded from environment variables — never hardcode credentials in source.
// Set in .env.local (local dev) and Vercel / hosting env vars (production).
export const PLATFORM_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_PLATFORM_ADMIN_EMAIL ?? 'ceo@fusion8.com';

export const PLATFORM_ADMIN_UID =
  process.env.NEXT_PUBLIC_PLATFORM_ADMIN_UID ?? '';

function isCEO(email: string | null | undefined, uid: string): boolean {
  return isCEOShared(email, uid, PLATFORM_ADMIN_EMAIL, PLATFORM_ADMIN_UID);
}

function mapAuthError(error: AuthError): string {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try logging in instead.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Invalid email or password.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/invalid-email':
      return 'Invalid email format. Please check for extra spaces.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes before trying again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Please try again.';
    case 'auth/popup-blocked':
      return 'Popup blocked by your browser. Please allow popups for this site.';
    case 'auth/firebase-app-check-token-is-invalid':
    case 'auth/app-check-token-is-invalid':
      return 'Security verification failed. Please disable App Check enforcement in Firebase Console → App Check, then try again.';
    default:
      return `Authentication failed. Please try again. (${error.code})`;
  }
}

/**
 * Creates O(1) security marker documents for Firestore rule evaluation.
 * roles_admin/{uid} → admin check
 * approved_teachers/{uid} → teacher access check
 */
async function ensureSecurityMarkers(
  uid: string,
  role: UserRole,
  approved?: boolean,
  email?: string | null
) {
  const ceo = isCEO(email, uid);

  if (role === 'admin' || ceo) {
    await setDoc(
      doc(firestore, 'roles_admin', uid),
      { active: true, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } else if (role === 'teacher' && approved) {
    await setDoc(
      doc(firestore, 'approved_teachers', uid),
      { active: true, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
}

export async function signUpUser(
  email: string,
  password: string,
  name: string,
  role: UserRole = 'student'
) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );
    const user = userCredential.user;

    let finalRole: UserRole = 'student';
    let isApproved = true;

    if (isCEO(normalizedEmail, user.uid)) {
      finalRole = 'admin';
    } else {
      const teacherEmailDoc = await getDoc(
        doc(firestore, 'approved_teacher_emails', normalizedEmail)
      );
      if (teacherEmailDoc.exists()) {
        finalRole = 'teacher';
        isApproved = true;
      } else if (role === 'teacher') {
        finalRole = 'teacher';
        isApproved = false;
      }
    }

    const userProfile: UserProfile = {
      id: user.uid,
      email: normalizedEmail,
      displayName: name,
      role: finalRole,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      accountType: 'email',
      onboardingCompleted: false,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
      approved: isApproved,
    };

    await ensureSecurityMarkers(user.uid, finalRole, isApproved, normalizedEmail);
    await setDoc(doc(firestore, 'users', user.uid), userProfile);

    try {
      await sendEmailVerification(user);
    } catch {
      // Non-fatal: account created, verification email delivery failed
    }

    // Sign out immediately — user must verify email before accessing the platform
    await firebaseSignOut(auth);

    return {
      success: true,
      uid: user.uid,
      role: finalRole,
      approved: isApproved,
      requiresVerification: true,
    };
  } catch (error: any) {
    return { success: false, error: mapAuthError(error) };
  }
}

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    const email = user.email?.toLowerCase();
    const ceo = isCEO(email, user.uid);

    const docRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(docRef);

    let finalRole: UserRole = 'student';
    let isApproved = true;

    if (!userDoc.exists()) {
      if (ceo) {
        finalRole = 'admin';
      } else {
        const teacherEmailDoc = await getDoc(
          doc(firestore, 'approved_teacher_emails', email!)
        );
        if (teacherEmailDoc.exists()) finalRole = 'teacher';
      }

      const userProfile: UserProfile = {
        id: user.uid,
        email: email!,
        displayName: user.displayName || 'User',
        role: finalRole,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        accountType: 'google',
        onboardingCompleted: false,
        photoURL:
          user.photoURL ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        approved: isApproved,
      };
      await ensureSecurityMarkers(user.uid, finalRole, isApproved, email);
      await setDoc(docRef, userProfile);
    } else {
      const data = userDoc.data() as UserProfile;
      finalRole = data.role;
      isApproved = data.approved ?? true;

      const updates: Partial<UserProfile> & { lastLogin: any } = {
        lastLogin: serverTimestamp(),
      };

      if (ceo && data.role !== 'admin') {
        updates.role = 'admin';
        updates.approved = true;
        finalRole = 'admin';
        isApproved = true;
      }

      await setDoc(docRef, updates, { merge: true });
      await ensureSecurityMarkers(user.uid, finalRole, isApproved, email);
    }

    // Issue session cookie — if this fails, the user cannot access protected routes
    const idToken = await user.getIdToken();
    const sessionResult = await createSession(idToken);
    if (!sessionResult.success) {
      await firebaseSignOut(auth);
      return {
        success: false,
        error: 'Session could not be established. Check your Firebase Admin SDK credentials and restart the server.',
      };
    }

    return { success: true, uid: user.uid, role: finalRole, approved: isApproved };
  } catch (error: any) {
    return { success: false, error: mapAuthError(error) };
  }
}

export async function signInUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );
    const user = userCredential.user;
    const ceo = isCEO(normalizedEmail, user.uid);

    if (!user.emailVerified && !ceo) {
      await firebaseSignOut(auth);
      return {
        success: false,
        error:
          'Please verify your email before signing in. Check your inbox (or spam folder) for the verification link.',
      };
    }

    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    let finalRole: UserRole = ceo ? 'admin' : 'student';
    let isApproved = true;

    if (!userDoc.exists()) {
      await ensureSecurityMarkers(user.uid, finalRole, isApproved, normalizedEmail);
      await setDoc(doc(firestore, 'users', user.uid), {
        id: user.uid,
        email: normalizedEmail,
        displayName: user.displayName || 'User',
        role: finalRole,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        accountType: 'email',
        onboardingCompleted: false,
        approved: isApproved,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
      });
    } else {
      const data = userDoc.data() as UserProfile;
      finalRole = ceo && data.role !== 'admin' ? 'admin' : data.role;
      isApproved = data.approved ?? true;

      const updates: Record<string, any> = { lastLogin: serverTimestamp() };
      if (ceo && data.role !== 'admin') {
        updates.role = 'admin';
        updates.approved = true;
      }

      await setDoc(doc(firestore, 'users', user.uid), updates, { merge: true });
      await ensureSecurityMarkers(user.uid, finalRole, isApproved, normalizedEmail);
    }

    // Issue session cookie — if this fails, the user cannot access protected routes
    const idToken = await user.getIdToken();
    const sessionResult = await createSession(idToken);
    if (!sessionResult.success) {
      await firebaseSignOut(auth);
      return {
        success: false,
        error: 'Session could not be established. Check your Firebase Admin SDK credentials and restart the server.',
      };
    }

    return { success: true, uid: user.uid, role: finalRole, approved: isApproved };
  } catch (error: any) {
    return { success: false, error: mapAuthError(error) };
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    await destroySession();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function adminResetUserPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: mapAuthError(error) };
  }
}
