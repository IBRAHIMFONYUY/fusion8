'use client';

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '@/firebase';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: any;
  photoURL?: string;
  approved?: boolean;
  matricule?: string;
  mentorId?: string;
  mentorName?: string;
}

export const PLATFORM_ADMIN_EMAIL = 'ceo@fusion8.com';

function mapAuthError(error: AuthError): string {
  switch (error.code) {
    case 'auth/email-already-in-use': return 'Email already registered.';
    case 'auth/invalid-credential': return 'Invalid email or password.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/user-not-found': return 'Account not found.';
    default: return 'Authentication failed. Please check your credentials.';
  }
}

/**
 * Ensures O(1) high-performance security markers are in place for Admins/Teachers
 */
async function ensureSecurityMarkers(uid: string, role: UserRole, approved?: boolean, email?: string | null) {
  const isCEO = email?.toLowerCase() === PLATFORM_ADMIN_EMAIL || uid === 'x8rM4ioT6jTMU0rEfy2ujMQ0sFy1';
  
  if (role === 'admin' || isCEO) {
    await setDoc(doc(firestore, 'roles_admin', uid), { active: true, updatedAt: serverTimestamp() }, { merge: true });
  } else if (role === 'teacher' && approved) {
    await setDoc(doc(firestore, 'approved_teachers', uid), { active: true, updatedAt: serverTimestamp() }, { merge: true });
  }
}

export async function signUpUser(email: string, password: string, name: string, role: UserRole = 'student') {
  try {
    const normalizedEmail = email.toLowerCase();
    const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    const user = userCredential.user;
    
    let finalRole: UserRole = 'student';
    let isApproved = true;
    
    if (normalizedEmail === PLATFORM_ADMIN_EMAIL || user.uid === 'x8rM4ioT6jTMU0rEfy2ujMQ0sFy1') {
      finalRole = 'admin';
    } else {
      const teacherEmailDoc = await getDoc(doc(firestore, 'approved_teacher_emails', normalizedEmail));
      if (teacherEmailDoc.exists()) {
        finalRole = 'teacher';
      }
    }

    const userProfile: UserProfile = {
      id: user.uid,
      email: normalizedEmail,
      displayName: name,
      role: finalRole,
      createdAt: serverTimestamp(),
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
      approved: isApproved
    };

    // Ensure markers exist BEFORE returning success to the provider
    await ensureSecurityMarkers(user.uid, finalRole, isApproved, normalizedEmail);
    await setDoc(doc(firestore, 'users', user.uid), userProfile);
    
    try {
      await sendEmailVerification(user);
    } catch (err) {
      console.error('Failed to send verification email', err);
    }
    
    return { success: true, uid: user.uid, role: finalRole, approved: isApproved };
  } catch (error: any) {
    return { success: false, error: mapAuthError(error) };
  }
}

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    const docRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(docRef);

    const email = user.email?.toLowerCase();
    const isCEO = email === PLATFORM_ADMIN_EMAIL || user.uid === 'x8rM4ioT6jTMU0rEfy2ujMQ0sFy1';

    if (!userDoc.exists()) {
      let finalRole: UserRole = 'student';
      if (isCEO) {
        finalRole = 'admin';
      } else {
        const teacherEmailDoc = await getDoc(doc(firestore, 'approved_teacher_emails', email!));
        if (teacherEmailDoc.exists()) {
          finalRole = 'teacher';
        }
      }
      const userProfile: UserProfile = {
        id: user.uid,
        email: email!,
        displayName: user.displayName || 'User',
        role: finalRole,
        createdAt: serverTimestamp(),
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        approved: true
      };
      await ensureSecurityMarkers(user.uid, finalRole, true, email);
      await setDoc(docRef, userProfile);
      return { success: true, uid: user.uid, role: finalRole, approved: true };
    }

    const data = userDoc.data() as UserProfile;
    if (isCEO && data.role !== 'admin') {
        await setDoc(docRef, { role: 'admin', approved: true }, { merge: true });
        data.role = 'admin';
        data.approved = true;
    }

    await ensureSecurityMarkers(user.uid, data.role, data.approved, email);
    return { success: true, uid: user.uid, role: data.role, approved: data.approved };
  } catch (error: any) {
    return { success: false, error: mapAuthError(error) };
  }
}

export async function signInUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase();
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const user = userCredential.user;
    const isCEO = normalizedEmail === PLATFORM_ADMIN_EMAIL || user.uid === 'x8rM4ioT6jTMU0rEfy2ujMQ0sFy1';
    
    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    
    if (!userDoc.exists()) {
      const role: UserRole = isCEO ? 'admin' : 'student';
      const approved = true;
      
      await ensureSecurityMarkers(user.uid, role, approved, normalizedEmail);
      await setDoc(doc(firestore, 'users', user.uid), {
        id: user.uid,
        email: normalizedEmail,
        displayName: user.displayName || 'User',
        role: role,
        createdAt: serverTimestamp(),
        approved: approved
      });
      
      return { success: true, uid: user.uid, role, approved: approved };
    }

    const data = userDoc.data() as UserProfile;
    if (isCEO && data.role !== 'admin') {
        await setDoc(doc(firestore, 'users', user.uid), { role: 'admin', approved: true }, { merge: true });
        data.role = 'admin';
        data.approved = true;
    }

    await ensureSecurityMarkers(user.uid, data.role, data.approved, normalizedEmail);
    return { success: true, uid: user.uid, role: data.role, approved: data.approved };
  } catch (error: any) {
    if (normalizedEmail === PLATFORM_ADMIN_EMAIL && (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found')) {
       const signUpResult = await signUpUser(normalizedEmail, password, 'Platform CEO', 'admin');
       if (signUpResult.success) return signUpResult;
    }
    return { success: false, error: mapAuthError(error) };
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
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