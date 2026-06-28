'use server';

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// The session cookie mirrors the Firebase ID token so middleware can protect
// routes without a network call to Firebase on every request.
const SESSION_COOKIE = '__session';
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

/**
 * Exchange a Firebase ID token (from client-side auth) for a server-managed
 * session cookie. Called immediately after signIn/signUp on the client.
 */
export async function createSession(idToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the token is genuine before issuing a session
    await adminAuth.verifyIdToken(idToken);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS / 1000,
      path: '/',
    });

    return { success: true };
  } catch (error: any) {
    console.error('[createSession] Failed to verify ID token:', error.message);
    return { success: false, error: 'Invalid session token.' };
  }
}

/**
 * Destroy the session cookie, forcing the middleware to redirect the user to /login.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Verify the current session cookie and return the decoded user claims.
 * Returns null if the cookie is missing or the token is expired/invalid.
 */
export async function verifySession(): Promise<{
  uid: string;
  email: string | undefined;
  role?: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email,
      role: (decoded as any).role,
    };
  } catch {
    return null;
  }
}

/**
 * Create a new user account using the Firebase Admin SDK (server-side only).
 * This is the authoritative signup path — the client SDK version in lib/auth.ts
 * handles the browser flow (email verification, Google OAuth) and calls
 * createSession after success.
 */
export async function adminCreateUser(params: {
  email: string;
  password: string;
  displayName: string;
  role: 'student' | 'teacher' | 'admin';
}): Promise<{ success: boolean; uid?: string; error?: string }> {
  try {
    const { email, password, displayName, role } = params;
    const normalizedEmail = email.toLowerCase().trim();

    const userRecord = await adminAuth.createUser({
      email: normalizedEmail,
      password,
      displayName,
      emailVerified: false,
    });

    const isAdmin = normalizedEmail === process.env.PLATFORM_ADMIN_EMAIL ||
      userRecord.uid === process.env.PLATFORM_ADMIN_UID;

    const finalRole = isAdmin ? 'admin' : role;

    // Persist the user profile in Firestore via Admin SDK — bypasses client security
    // rules so the write always succeeds regardless of the new user's auth state.
    await adminDb.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email: normalizedEmail,
      displayName,
      role: finalRole,
      approved: finalRole !== 'teacher',
      createdAt: FieldValue.serverTimestamp(),
      lastLogin: FieldValue.serverTimestamp(),
      accountType: 'email',
      onboardingCompleted: false,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userRecord.uid}`,
    });

    // Write security marker documents for O(1) role resolution in Firestore rules
    if (finalRole === 'admin') {
      await adminDb.collection('roles_admin').doc(userRecord.uid).set({
        active: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else if (finalRole === 'teacher') {
      await adminDb.collection('teacher_applications').doc(userRecord.uid).set({
        uid: userRecord.uid,
        name: displayName,
        email: normalizedEmail,
        status: 'pending',
        appliedAt: FieldValue.serverTimestamp(),
      });
    }

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error('[adminCreateUser] Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Approve a teacher account. Sets the approved flag and writes the
 * approved_teachers security marker so Firestore rules immediately grant access.
 */
export async function approveTeacher(teacherUid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const batch = adminDb.batch();

    batch.update(adminDb.collection('users').doc(teacherUid), {
      approved: true,
      approvedAt: FieldValue.serverTimestamp(),
    });

    batch.set(
      adminDb.collection('approved_teachers').doc(teacherUid),
      { active: true, approvedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    batch.update(adminDb.collection('teacher_applications').doc(teacherUid), {
      status: 'approved',
      reviewedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error('[approveTeacher] Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Reject a teacher application.
 */
export async function rejectTeacher(
  teacherUid: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const batch = adminDb.batch();

    batch.update(adminDb.collection('users').doc(teacherUid), {
      approved: false,
      rejectedAt: FieldValue.serverTimestamp(),
      rejectionReason: reason ?? '',
    });

    batch.update(adminDb.collection('teacher_applications').doc(teacherUid), {
      status: 'rejected',
      rejectionReason: reason ?? '',
      reviewedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error('[rejectTeacher] Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Promote a user to admin role using the Admin SDK.
 * Only callable from server context (admin dashboard server action).
 */
export async function promoteToAdmin(targetUid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const batch = adminDb.batch();

    batch.update(adminDb.collection('users').doc(targetUid), {
      role: 'admin',
      promotedAt: FieldValue.serverTimestamp(),
    });

    batch.set(
      adminDb.collection('roles_admin').doc(targetUid),
      { active: true, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error('[promoteToAdmin] Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Revoke a user's session by deleting their session cookie.
 * Used by admin to force-logout a user.
 */
export async function adminRevokeUserSessions(
  targetUid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminAuth.revokeRefreshTokens(targetUid);
    return { success: true };
  } catch (error: any) {
    console.error('[adminRevokeUserSessions] Error:', error.message);
    return { success: false, error: error.message };
  }
}
