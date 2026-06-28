import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  courseTitle?: string;
  studentName?: string;
}

export interface PaymentInitiationResult {
  success: boolean;
  transId?: string;
  message?: string;
  alreadyEnrolled?: boolean;
  error?: string;
}

export interface EnrollmentStatus {
  status: 'active' | 'pending_payment' | 'failed' | null;
  paymentReference?: string;
  transId?: string;
}

export const paymentService = {
  /**
   * Initiates a real Fapshi mobile money payment via our secure API route.
   * The API route calls the Fapshi REST API server-side so that the API key
   * is never exposed in the browser bundle.
   *
   * Flow:
   * 1. Client calls this method
   * 2. This method calls /api/payments/initiate (our Next.js API route)
   * 3. API route calls Fapshi /initiate-pay with server-side credentials
   * 4. Fapshi sends a USSD prompt to the user's phone
   * 5. User approves on their phone
   * 6. Fapshi calls our webhook /api/webhooks/fapshi with the result
   * 7. Webhook activates the enrollment in Firestore
   */
  async initiatePayment(data: PaymentRequest): Promise<PaymentInitiationResult> {
    const enrollmentId = `${data.studentId}_${data.courseId}`;
    const enrollmentRef = doc(firestore, 'enrollments', enrollmentId);

    // Guard: short-circuit if already enrolled
    try {
      const snap = await getDoc(enrollmentRef);
      if (snap.exists() && snap.data().status === 'active') {
        return { success: true, alreadyEnrolled: true };
      }
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({ path: enrollmentRef.path, operation: 'get' })
        );
      }
      throw err;
    }

    // Create a pending enrollment record immediately so the student can see
    // a "payment processing" state if they return to the course page.
    const pendingPayload = {
      id: enrollmentId,
      studentId: data.studentId,
      courseId: data.courseId,
      amountPaid: data.amount,
      paymentPhone: data.phone,
      paymentEmail: data.email,
      paymentNetwork: data.network,
      status: 'pending_payment',
      progress: 0,
      completedLessons: [],
      enrolledAt: serverTimestamp(),
    };

    try {
      await setDoc(enrollmentRef, pendingPayload, { merge: true });
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: enrollmentRef.path,
            operation: 'write',
            requestResourceData: pendingPayload,
          })
        );
      }
      throw err;
    }

    // Delegate to our secure server-side API route
    const response = await fetch('/api/payments/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: data.amount,
        phone: data.phone,
        email: data.email,
        network: data.network,
        studentId: data.studentId,
        courseId: data.courseId,
        courseTitle: data.courseTitle,
        studentName: data.studentName,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      // Roll back the pending enrollment record on payment initiation failure
      try {
        await updateDoc(enrollmentRef, {
          status: 'failed',
          failedAt: serverTimestamp(),
          failureReason: result.error ?? 'Payment initiation failed',
        });
      } catch {
        // Best-effort rollback
      }
      return { success: false, error: result.error ?? 'Payment initiation failed.' };
    }

    // Store the Fapshi transaction ID on the enrollment so the webhook can
    // look up the record when the payment completes.
    try {
      await updateDoc(enrollmentRef, { transId: result.transId });
    } catch {
      // Non-fatal: webhook will still find the record via studentId+courseId
    }

    return { success: true, transId: result.transId, message: result.message };
  },

  /**
   * Poll the payment status for a given transaction. Used to show the user
   * a real-time status indicator while they wait for the USSD prompt.
   */
  async checkPaymentStatus(transId: string): Promise<{
    status: 'SUCCESSFUL' | 'FAILED' | 'PENDING' | 'EXPIRED' | 'UNKNOWN';
    message?: string;
  }> {
    try {
      const response = await fetch(`/api/payments/status/${transId}`);
      const result = await response.json();
      return { status: result.status ?? 'UNKNOWN', message: result.message };
    } catch {
      return { status: 'UNKNOWN' };
    }
  },

  /**
   * Verify if a student has an active enrollment for a course.
   */
  async checkEnrollmentStatus(studentId: string, courseId: string): Promise<string | null> {
    if (!studentId || !courseId) return null;

    const enrollmentId = `${studentId}_${courseId}`;
    const docRef = doc(firestore, 'enrollments', enrollmentId);

    try {
      const snap = await getDoc(docRef);
      return snap.exists() ? (snap.data().status as string) : null;
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({ path: docRef.path, operation: 'get' })
        );
      }
      return null;
    }
  },
};
