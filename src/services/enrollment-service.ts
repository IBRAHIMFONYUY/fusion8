import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  getDoc, 
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
      const snap = await getDoc(enrollmentRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const completedLessons = data.completedLessons || [];
      
      if (completedLessons.includes(lessonId)) return;

      const updatedCompleted = [...completedLessons, lessonId];
      const progress = Math.round((updatedCompleted.length / totalLessons) * 100);

      const payload = {
        completedLessons: arrayUnion(lessonId),
        progress: progress,
        lastAccessedAt: serverTimestamp(),
      };

      await updateDoc(enrollmentRef, payload);
      return { progress };
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
