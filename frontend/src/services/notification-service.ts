import { addDoc, collection, query, where, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/firebase';

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
    await addDoc(collection(firestore, 'notifications'), {
      ...payload,
      userId,
      createdAt: serverTimestamp(),
      read: false,
    });
  },

  /**
   * Fan-out notification to all students
   * Used for major platform announcements or new course publications
   */
  async notifyAllStudents(payload: NotificationPayload) {
    const q = query(collection(firestore, 'users'), where('role', '==', 'student'));
    const snapshot = await getDocs(q);

    await writeInBatchesOf500(snapshot.docs.map((userDoc) => ({
      ...payload,
      userId: userDoc.id,
      createdAt: serverTimestamp(),
      read: false,
    })));
  },

  /**
   * Fan-out notification to all students currently enrolled in a specific course.
   * Used for class scheduling, new lessons, etc.
   */
  async notifyCourseStudents(courseId: string, payload: NotificationPayload) {
    const q = query(
      collection(firestore, 'enrollments'),
      where('courseId', '==', courseId),
      where('status', '==', 'active'),
    );
    const snapshot = await getDocs(q);

    const items = snapshot.docs
      .map((d) => d.data())
      .filter((d) => !!d.studentId)
      .map((d) => ({
        ...payload,
        courseId,
        userId: d.studentId,
        createdAt: serverTimestamp(),
        read: false,
      }));

    await writeInBatchesOf500(items);
  }
};

/**
 * Firestore commits are capped at 500 operations each. Chunk the writes
 * so fan-outs to very large audiences don't silently fail.
 */
async function writeInBatchesOf500(items: Record<string, any>[]) {
  const CHUNK = 450;
  for (let i = 0; i < items.length; i += CHUNK) {
    const batch = writeBatch(firestore);
    items.slice(i, i + CHUNK).forEach((data) => {
      const ref = doc(collection(firestore, 'notifications'));
      batch.set(ref, data);
    });
    await batch.commit();
  }
}
