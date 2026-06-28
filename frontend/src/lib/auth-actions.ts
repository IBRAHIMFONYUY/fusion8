'use server';

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const SESSION_COOKIE = '__session';
// Firebase session cookies support up to 14 days. We use 5.
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

/**
 * Exchange a Firebase ID token for a long-lived Firebase session cookie.
 *
 * IMPORTANT: We must use adminAuth.createSessionCookie(), NOT store the raw
 * ID token. Raw ID tokens expire after 1 hour. Firebase session cookies
 * last for the configured duration (5 days here) and can be revoked server-side.
 */
export async function createSession(
  idToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS / 1000,
      path: '/',
    });

    return { success: true };
  } catch (error: any) {
    console.error('[createSession] Failed to create session cookie:', error.message);
    return { success: false, error: 'Could not establish session. Please try again.' };
  }
}

/**
 * Destroy the session cookie, forcing middleware to redirect to /login.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Verify the session cookie and return decoded user claims.
 * Uses verifySessionCookie (not verifyIdToken) because the cookie is a
 * Firebase session cookie, not a raw ID token.
 * Returns null if the cookie is missing, expired, or revoked.
 */
export async function verifySession(): Promise<{
  uid: string;
  email: string | undefined;
  role?: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sessionCookie) return null;

    // checkRevoked: true — honours adminAuth.revokeRefreshTokens() calls
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email,
      role: (decoded as any).role,
    };
  } catch {
    // Cookie expired, revoked, or tampered with
    return null;
  }
}

/**
 * Create a new user account via the Firebase Admin SDK.
 * Called from server-side admin actions only.
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

    const isAdmin =
      normalizedEmail === process.env.PLATFORM_ADMIN_EMAIL ||
      userRecord.uid === process.env.PLATFORM_ADMIN_UID;

    const finalRole = isAdmin ? 'admin' : role;

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
 * Approve a teacher account.
 * Writes four documents atomically:
 *   1. users/{uid}.approved = true
 *   2. approved_teachers/{uid} (security marker for Firestore rules)
 *   3. teacher_applications/{applicationId}.status = 'approved'
 *   4. approved_teacher_emails/{email} (email whitelist for future registrations)
 *
 * applicationId may differ from teacherUid if the form auto-generated the doc ID.
 */
export async function approveTeacher(params: {
  teacherUid: string;
  applicationId?: string;
  email?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { teacherUid, applicationId, email } = params;
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

    const appDocId = applicationId ?? teacherUid;
    batch.update(adminDb.collection('teacher_applications').doc(appDocId), {
      status: 'approved',
      reviewedAt: FieldValue.serverTimestamp(),
    });

    if (email) {
      batch.set(
        adminDb.collection('approved_teacher_emails').doc(email.toLowerCase()),
        { approvedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }

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
 * Promote a user to admin role.
 */
export async function promoteToAdmin(
  targetUid: string
): Promise<{ success: boolean; error?: string }> {
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
 * Revoke a user's session tokens, invalidating all active sessions.
 * The next request will fail verifySessionCookie with checkRevoked:true.
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
