
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  updateDoc,
  writeBatch,
  addDoc,
  limit
} from 'firebase/firestore';
import { firestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export interface LMSUser {
  id: string;
  role: 'student' | 'teacher' | 'admin';
  approved: boolean;
  displayName: string;
}

export interface LMSCourse {
  id: string;
  title: string;
  teacherId: string;
  description: string;
  longDescription?: string;
  price?: number;
  thumbnail?: string;
  status: 'draft' | 'pending' | 'approved' | 'published';
  enrolledCount: number;
  createdAt: any;
}

export const lmsService = {
  // --- CATALOG ---
  async getCatalog(): Promise<LMSCourse[]> {
    try {
      const q = query(
        collection(firestore, 'courses'),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as LMSCourse));
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'courses',
          operation: 'list',
        }));
        return [];
      }
      
      // Resilient fallback for index building
      try {
        const q2 = query(
          collection(firestore, 'courses'),
          where('status', '==', 'published')
        );
        const snap = await getDocs(q2);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as LMSCourse))
            .sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      } catch (e) {
        return [];
      }
    }
  },

  async getPopularCourses(maxCount: number = 6): Promise<LMSCourse[]> {
    try {
      const q = query(
        collection(firestore, 'courses'),
        where('status', '==', 'published'),
        orderBy('enrolledCount', 'desc'),
        limit(maxCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as LMSCourse));
    } catch (error: any) {
      // Fallback to standard catalog if index is building
      const catalog = await this.getCatalog();
      return catalog.sort((a,b) => (b.enrolledCount || 0) - (a.enrolledCount || 0)).slice(0, maxCount);
    }
  },

  async getCourseById(courseId: string): Promise<any> {
    const docRef = doc(firestore, 'courses', courseId);
    try {
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        
        const modulesQ = query(collection(firestore, `courses/${courseId}/modules`), orderBy('order', 'asc'));
        const lessonsQ = query(collection(firestore, `courses/${courseId}/lessons`), orderBy('order', 'asc'));
        
        const [modulesSnap, lessonsSnap] = await Promise.all([getDocs(modulesQ), getDocs(lessonsQ)]);
        
        const allLessons = lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const modules = modulesSnap.docs.map(mDoc => ({
          id: mDoc.id,
          ...mDoc.data(),
          lessons: allLessons.filter((l: any) => l.moduleId === mDoc.id)
        }));

        return {
          ...snap.data(),
          id: snap.id,
          modules
        };
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'get',
            }));
        }
        return null;
    }
  },

  // --- TEACHER FLOWS ---
  async getTeacherCourses(teacherId: string): Promise<LMSCourse[]> {
    try {
        const q = query(
          collection(firestore, 'courses'),
          where('teacherId', '==', teacherId),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as LMSCourse));
    } catch (e: any) {
        // Fallback for building index or permissions
        const q2 = query(collection(firestore, 'courses'), where('teacherId', '==', teacherId));
        const snap = await getDocs(q2).catch(err => {
            if (err.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: 'courses',
                    operation: 'list',
                }));
            }
            throw err;
        });
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as LMSCourse))
            .sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }
  },

  async saveCourseCurriculum(teacherId: string, courseData: any) {
    const batch = writeBatch(firestore);
    const targetStatus = courseData.status || 'draft';
    const courseRef = doc(firestore, 'courses', courseData.id);

    const existingSnap = await getDoc(courseRef).catch(() => null);
    const isNew = !existingSnap || !existingSnap.exists();

    const coursePayload: Record<string, any> = {
      id: courseData.id,
      title: courseData.title || 'Untitled Course',
      description: courseData.description || '',
      longDescription: courseData.longDescription || '',
      teacherId: teacherId,
      status: targetStatus,
      price: Number(courseData.price) || 5000,
      thumbnail: courseData.thumbnail || courseData.imageUrl || '',
      updatedAt: serverTimestamp(),
    };

    if (isNew) {
      coursePayload.createdAt = serverTimestamp();
      coursePayload.enrolledCount = 0;
    }

    batch.set(courseRef, coursePayload, { merge: true });

    if (courseData.modules) {
      for (let mIndex = 0; mIndex < courseData.modules.length; mIndex++) {
        const module = courseData.modules[mIndex];
        const moduleRef = doc(firestore, `courses/${courseData.id}/modules`, module.id);
        batch.set(moduleRef, {
          id: module.id,
          courseId: courseData.id,
          teacherId: teacherId,
          title: module.title,
          order: mIndex,
        }, { merge: true });

        if (module.lessons) {
          for (let lIndex = 0; lIndex < module.lessons.length; lIndex++) {
            const lesson = module.lessons[lIndex];
            const lessonRef = doc(firestore, `courses/${courseData.id}/lessons`, lesson.id);
            batch.set(lessonRef, {
              id: lesson.id,
              courseId: courseData.id,
              moduleId: module.id,
              teacherId: teacherId,
              title: lesson.title,
              youtubeVideoUrl: lesson.videoUrl || '',
              content: lesson.content || '',
              duration: lesson.duration || '10',
              order: lIndex,
            }, { merge: true });
          }
        }
      }
    }

    await batch.commit().catch(async (error: any) => {
      if (error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `courses/${courseData.id}`,
          operation: 'write',
          requestResourceData: coursePayload,
        } satisfies SecurityRuleContext));
      }
      throw error;
    });

    if (targetStatus === 'published' || targetStatus === 'pending') {
      const notifData = {
        message: `CURRICULUM UPDATE: "${coursePayload.title}" has been modified by the instructor. Review required for preview.`,
        type: 'COURSE_UPDATE',
        courseId: courseData.id,
        senderId: teacherId,
        global: true,
        adminOnly: true,
        createdAt: serverTimestamp(),
      };
      
      addDoc(collection(firestore, 'notifications'), notifData).catch(async (err: any) => {
        if (err.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'notifications',
            operation: 'create',
            requestResourceData: notifData,
          } satisfies SecurityRuleContext));
        }
      });
    }
  },

  async getAllCoursesAdmin(): Promise<LMSCourse[]> {
    try {
        const snap = await getDocs(collection(firestore, 'courses'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as LMSCourse));
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'courses',
                operation: 'list',
            }));
        }
        return [];
    }
  },

  async updateCourseStatus(courseId: string, status: LMSCourse['status']) {
    const ref = doc(firestore, 'courses', courseId);
    return updateDoc(ref, { status }).catch(async (error: any) => {
      if (error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `courses/${courseId}`,
          operation: 'update',
          requestResourceData: { status },
        } satisfies SecurityRuleContext));
      }
      throw error;
    });
  },

  async deleteCourse(courseId: string) {
    const courseRef = doc(firestore, 'courses', courseId);
    const batch = writeBatch(firestore);

    try {
      const modulesSnap = await getDocs(collection(firestore, `courses/${courseId}/modules`));
      const lessonsSnap = await getDocs(collection(firestore, `courses/${courseId}/lessons`));

      modulesSnap.forEach(m => batch.delete(m.ref));
      lessonsSnap.forEach(l => batch.delete(l.ref));
      batch.delete(courseRef);

      return await batch.commit().catch(async (err: any) => {
        if (err.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `courses/${courseId}`,
            operation: 'delete',
          } satisfies SecurityRuleContext));
        }
        throw err;
      });
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `courses/${courseId}`,
          operation: 'delete',
        } satisfies SecurityRuleContext));
      }
      throw error;
    }
  }
};
