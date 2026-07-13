'use server';

import { adminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifySession } from '@/lib/auth-actions';
import { generateCertificateId } from '@/lib/certificate-id';

export interface IssuedCertificate {
  certId: string;
  studentId: string;
  courseId: string;
  studentName: string;
  courseTitle: string;
  instructorName?: string;
  issuedAt: string;
  verificationUrl: string;
}

/**
 * Issues a certificate for a completed course. Re-validates completion
 * server-side (via the Admin SDK) rather than trusting the caller, since
 * firestore.rules intentionally does not allow students to write
 * `certificates` documents directly. Idempotent — safe to call repeatedly.
 */
export async function issueCertificateAction(
  courseId: string
): Promise<{ success: boolean; certificate?: IssuedCertificate; error?: string }> {
  const session = await verifySession();
  if (!session) {
    return { success: false, error: 'Unauthorized.' };
  }

  const enrollmentId = `${session.uid}_${courseId}`;
  const enrollmentSnap = await adminDb.collection('enrollments').doc(enrollmentId).get();
  if (!enrollmentSnap.exists) {
    return { success: false, error: 'No enrollment found for this course.' };
  }
  const enrollment = enrollmentSnap.data()!;
  if (enrollment.status !== 'active' || (enrollment.progress ?? 0) < 100) {
    return { success: false, error: 'This course is not yet complete.' };
  }

  const certRef = adminDb.collection('certificates').doc(enrollmentId);
  const existing = await certRef.get();
  if (existing.exists) {
    const data = existing.data()!;
    return {
      success: true,
      certificate: {
        certId: data.certId,
        studentId: data.studentId,
        courseId: data.courseId,
        studentName: data.studentName,
        courseTitle: data.courseTitle,
        instructorName: data.instructorName ?? undefined,
        issuedAt: data.issuedAt?.toDate?.().toISOString?.() ?? new Date().toISOString(),
        verificationUrl: data.verificationUrl,
      },
    };
  }

  const courseSnap = await adminDb.collection('courses').doc(courseId).get();
  if (!courseSnap.exists) {
    return { success: false, error: 'Course not found.' };
  }
  const course = courseSnap.data()!;

  const [studentSnap, teacherSnap] = await Promise.all([
    adminDb.collection('users').doc(session.uid).get(),
    course.teacherId ? adminDb.collection('users').doc(course.teacherId).get() : Promise.resolve(null),
  ]);

  const studentName = studentSnap.exists ? (studentSnap.data()!.displayName ?? 'Fusion8 Learner') : 'Fusion8 Learner';
  const instructorName = teacherSnap?.exists ? (teacherSnap.data()!.displayName ?? undefined) : undefined;
  const courseTitle = course.title ?? 'Fusion8 Course';

  const certId = generateCertificateId(session.uid, courseId);
  const verificationUrl = `https://fusion8.tech/verify/${certId}`;

  await certRef.set({
    certId,
    studentId: session.uid,
    courseId,
    studentName,
    courseTitle,
    instructorName: instructorName ?? null,
    issuedAt: FieldValue.serverTimestamp(),
    verificationUrl,
  });

  return {
    success: true,
    certificate: {
      certId,
      studentId: session.uid,
      courseId,
      studentName,
      courseTitle,
      instructorName,
      issuedAt: new Date().toISOString(),
      verificationUrl,
    },
  };
}
