'use server';

import { adminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifySession } from '@/lib/auth-actions';

const CHECK_IN_OPENS_MS = 15 * 60 * 1000; // 15 minutes before start
const CHECK_IN_CLOSES_MS = 3 * 60 * 60 * 1000; // 3 hours after start

/**
 * Combines a broadcast's `date` (ISO string, midnight of the session's
 * calendar day) and `time` (`"HH:mm"`) into the actual session instant.
 * Matches the write shape in teacher/schedule/page.tsx.
 */
function getSessionStart(date: string, time: string): Date {
  const day = new Date(date);
  const [hours, minutes] = (time || '00:00').split(':').map(Number);
  day.setHours(hours || 0, minutes || 0, 0, 0);
  return day;
}

/**
 * Records a student's attendance for a live/practical session. Re-validates
 * enrollment and session timing server-side rather than trusting the caller
 * — the underlying firestore.rules allow any authenticated user to self-write
 * an attendance doc with no such checks, so this is the actual trust boundary
 * (attendance may feed internship records).
 */
export async function checkInAction(
  broadcastId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await verifySession();
  if (!session) {
    return { success: false, error: 'Unauthorized.' };
  }

  const broadcastSnap = await adminDb.collection('broadcasts').doc(broadcastId).get();
  if (!broadcastSnap.exists) {
    return { success: false, error: 'Session not found.' };
  }
  const broadcast = broadcastSnap.data()!;

  const enrollmentId = `${session.uid}_${broadcast.courseId}`;
  const enrollmentSnap = await adminDb.collection('enrollments').doc(enrollmentId).get();
  if (!enrollmentSnap.exists || enrollmentSnap.data()?.status !== 'active') {
    return { success: false, error: 'You are not enrolled in this course.' };
  }

  const sessionStart = getSessionStart(broadcast.date, broadcast.time);
  const now = Date.now();
  if (now < sessionStart.getTime() - CHECK_IN_OPENS_MS) {
    return { success: false, error: 'Check-in has not opened yet for this session.' };
  }
  if (now > sessionStart.getTime() + CHECK_IN_CLOSES_MS) {
    return { success: false, error: 'Check-in has closed for this session.' };
  }

  const attendanceRef = adminDb
    .collection('broadcasts')
    .doc(broadcastId)
    .collection('attendance')
    .doc(session.uid);

  const existing = await attendanceRef.get();
  if (existing.exists) {
    return { success: true };
  }

  await attendanceRef.set({
    studentId: session.uid,
    checkedInAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
}
