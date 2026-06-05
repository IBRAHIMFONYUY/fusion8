import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: 'active' | 'pending_payment';
  progress: number;
  completedLessons: string[];
  enrolledAt: any;
  lastAccessedAt?: any;
}

export const enrollmentService = {
  /**
   * Marks a lesson as complete and updates the overall course progress.
   */
  async markLessonComplete(db: Firestore, studentId: string, courseId: string, lessonId: string, totalLessons: number) {
    const enrollmentId = `${studentId}_${courseId}`;
    const enrollmentRef = doc(db, 'enrollments', enrollmentId);

    try {
      const result = await runTransaction(db, async (tx) => {
        const snap = await tx.get(enrollmentRef);
        if (!snap.exists()) return null;

        const data = snap.data();
        const completedLessons: string[] = data.completedLessons || [];

        if (completedLessons.includes(lessonId)) {
          return { progress: data.progress || 0, alreadyComplete: true };
        }

        const updatedCompleted = [...completedLessons, lessonId];
        const safeTotal = totalLessons > 0 ? totalLessons : updatedCompleted.length;
        const progress = Math.min(100, Math.round((updatedCompleted.length / safeTotal) * 100));

        tx.update(enrollmentRef, {
          completedLessons: updatedCompleted,
          progress,
          lastAccessedAt: serverTimestamp(),
        });

        return { progress, alreadyComplete: false };
      });

      return result ?? undefined;
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: enrollmentRef.path,
          operation: 'update',
        }));
      }
      throw err;
    }
  },

  /**
   * Fetches the enrollment record for a specific student and course.
   */
  async getEnrollment(db: Firestore, studentId: string, courseId: string): Promise<Enrollment | null> {
    if (!studentId || !courseId) return null;
    const enrollmentId = `${studentId}_${courseId}`;
    const docRef = doc(db, 'enrollments', enrollmentId);
    
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Enrollment;
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
