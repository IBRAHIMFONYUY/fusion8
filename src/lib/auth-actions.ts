'use server';

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '@/firebase';

export async function signUpUser(email: string, password: string, name: string, role: 'student' | 'teacher') {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName: name });

    const userProfile = {
      id: user.uid,
      email,
      displayName: name,
      role,
      createdAt: serverTimestamp(),
      photoURL: `https://picsum.photos/seed/${user.uid}/200/200`,
    };

    // Use setDoc to create the profile. Security rules allow this for the owner.
    await setDoc(doc(firestore, 'users', user.uid), userProfile);

    if (role === 'teacher') {
      // Teachers go into a vetting queue
      await setDoc(doc(firestore, 'teacher_applications', user.uid), {
        uid: user.uid,
        name,
        email,
        status: 'pending',
        appliedAt: serverTimestamp(),
      });
    }

    return { success: true, uid: user.uid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, uid: userCredential.user.uid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function logoutUser() {
  await firebaseSignOut(auth);
}