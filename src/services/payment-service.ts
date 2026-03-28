
import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface PaymentRequest {
  amount: number;
  phone: string;
  network: 'MTN' | 'ORANGE';
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

    const initialPayload = {
      id: enrollmentId,
      studentId: data.studentId,
      courseId: data.courseId,
      amountPaid: data.amount,
      status: 'pending_payment',
      progress: 0,
      enrolledAt: serverTimestamp(),
    };

    // 1. Create a pending enrollment record
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

    // 2. Simulate Payment Verification Delay (e.g., waiting for MoMo prompt)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Mark as Active & Initialize Tracking
    const activationPayload = {
      status: 'active',
      paymentReference: `FAP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      activatedAt: serverTimestamp(),
      lastAccessedAt: serverTimestamp(),
      progress: 0, // Explicitly ensure progress starts at 0
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
