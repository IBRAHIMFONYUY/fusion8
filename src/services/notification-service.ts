import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp, getFirestore } from 'firebase/firestore';
import { app } from '@/firebase/index';

const firestore = getFirestore(app);

export interface NotificationPayload {
  message: string;
  type: string;
  senderId?: string;
  courseId?: string;
}

export const notificationService = {
  /**
   * Send a notification to a specific user
   */
  async notifyUser(userId: string, payload: NotificationPayload) {
    const notifRef = doc(collection(firestore, 'notifications'));
    await writeBatch(firestore).set(notifRef, {
      ...payload,
      userId,
      createdAt: serverTimestamp(),
      read: false
    }).commit();
  },

  /**
   * Fan-out notification to all students
   * Used for major platform announcements or new course publications
   */
  async notifyAllStudents(payload: NotificationPayload) {
    const q = query(collection(firestore, 'users'), where('role', '==', 'student'));
    const snapshot = await getDocs(q);
    
    // Firestore batches support up to 500 operations
    const batch = writeBatch(firestore);
    snapshot.docs.forEach((userDoc) => {
      const notifRef = doc(collection(firestore, 'notifications'));
      batch.set(notifRef, {
        ...payload,
        userId: userDoc.id,
        createdAt: serverTimestamp(),
        read: false
      });
    });

    await batch.commit();
  },

  /**
   * Fan-out notification to all students currently enrolled in a specific course.
   * Used for class scheduling, new lessons, etc.
   */
  async notifyCourseStudents(courseId: string, payload: NotificationPayload) {
    const q = query(collection(firestore, 'enrollments'), where('courseId', '==', courseId));
    const snapshot = await getDocs(q);

    const batch = writeBatch(firestore);
    snapshot.docs.forEach((enrollmentDoc) => {
      const data = enrollmentDoc.data();
      if (data.studentId) {
        const notifRef = doc(collection(firestore, 'notifications'));
        batch.set(notifRef, {
          ...payload,
          courseId,
          userId: data.studentId,
          createdAt: serverTimestamp(),
          read: false
        });
      }
    });

    await batch.commit();
  }
};
