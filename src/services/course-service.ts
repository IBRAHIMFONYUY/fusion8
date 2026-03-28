
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { firestore } from '@/firebase';

export interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  status: 'draft' | 'pending' | 'approved' | 'published';
  enrolledCount: number;
  createdAt: any;
}

/**
 * @deprecated Use lmsService for all production course logic. 
 * This service is maintained for legacy compatibility but uses the normalized 'published' status.
 */
export const courseService = {
  async getPublishedCourses(): Promise<Course[]> {
    const q = query(
      collection(firestore, 'courses'), 
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
  },

  async createCourse(teacherId: string, data: Partial<Course>) {
    const courseRef = doc(collection(firestore, 'courses'));
    const newCourse = {
      ...data,
      id: courseRef.id,
      teacherId: teacherId,
      status: 'draft',
      enrolledCount: 0,
      createdAt: serverTimestamp(),
    };
    await setDoc(courseRef, newCourse);
    return newCourse;
  }
};
