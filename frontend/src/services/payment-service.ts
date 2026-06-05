
import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface PaymentRequest {
  amount: number;
  phone: string;
  email: string;
  network: 'MTN' | 'Orange';
  studentId: string;
  courseId: string;
}

export const paymentService = {
  /**
   * Initiates a payment via Fapshi and activates enrollment.
   */
  async initiatePayment(data: PaymentRequest) {
    const enrollmentId = `${data.studentId}_${data.courseId}`;
    const enrollmentRef = doc(firestore, 'enrollments', enrollmentId);

    // Guard: if the student is already enrolled, short-circuit so a re-entry
    // through the dialog cannot overwrite an active record with 'pending_payment'
    // (which would lock them out of the course).
    let existing: any = null;
    try {
      const snap = await getDoc(enrollmentRef);
      if (snap.exists()) existing = snap.data();
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: enrollmentRef.path,
          operation: 'get',
        }));
      }
      throw err;
    }

    if (existing?.status === 'active') {
      return { success: true, alreadyEnrolled: true };
    }

    const initialPayload = {
      id: enrollmentId,
      studentId: data.studentId,
      courseId: data.courseId,
      amountPaid: data.amount,
      paymentPhone: data.phone,
      paymentEmail: data.email,
      paymentNetwork: data.network,
      status: 'pending_payment',
      progress: existing?.progress ?? 0,
      completedLessons: existing?.completedLessons ?? [],
      enrolledAt: existing?.enrolledAt ?? serverTimestamp(),
    };

    // 1. Create or refresh the pending enrollment record
    try {
      await setDoc(enrollmentRef, initialPayload, { merge: true });
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: enrollmentRef.path,
          operation: 'write',
          requestResourceData: initialPayload,
        }));
      }
      throw err;
    }

    // 2. Simulate Payment Verification Delay (e.g., waiting for MoMo prompt).
    // TODO: replace with the real Fapshi webhook callback before go-live.
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Mark as Active & initialize tracking. Do NOT reset progress or
    //    completedLessons — a re-enrollment should preserve prior learning state.
    const activationPayload = {
      status: 'active',
      paymentReference: `FAP-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      activatedAt: serverTimestamp(),
      lastAccessedAt: serverTimestamp(),
    };

    try {
      await updateDoc(enrollmentRef, activationPayload);
      return { success: true };
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: enrollmentRef.path,
          operation: 'update',
          requestResourceData: activationPayload,
        }));
      }
      throw err;
    }
  },

  /**
   * Verifies if a user has access to a course.
   */
  async checkEnrollmentStatus(studentId: string, courseId: string) {
    if (!studentId || !courseId) return null;
    
    const enrollmentId = `${studentId}_${courseId}`;
    const docRef = doc(firestore, 'enrollments', enrollmentId);
    
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data().status as string;
      }
      return null;
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        }));
      }
      return null;
    }
  }
};
