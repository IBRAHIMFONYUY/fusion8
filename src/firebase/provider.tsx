'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { Button } from '@/components/ui/button';
import { Clock, Loader2 } from 'lucide-react';
import { signOut, PLATFORM_ADMIN_EMAIL } from '@/lib/auth';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

interface UserAuthState {
  user: User | null;
  role: 'student' | 'teacher' | 'admin' | null;
  approved: boolean | null;
  isLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState extends UserAuthState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [mounted, setMounted] = useState(false);
  const profileUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setMounted(true);

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // 1. Immediate Cleanup of any existing profile listener
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
        profileUnsubscribeRef.current = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        setIsProfileLoading(true);

        const profileRef = doc(firestore, 'users', firebaseUser.uid);
        
        // 2. Initialize Atomic Profile Listener
        profileUnsubscribeRef.current = onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            // High-Performance CEO / New User Auto-Recovery
            const email = firebaseUser.email?.toLowerCase();
            const isCEO = email === PLATFORM_ADMIN_EMAIL || firebaseUser.uid === 'x8rM4ioT6jTMU0rEfy2ujMQ0sFy1';
            setProfile({ role: isCEO ? 'admin' : 'student', approved: true });
          }
          setIsProfileLoading(false);
          setIsAuthLoading(false);
        }, (err) => {
          // Rule Propagation Recovery
          const email = firebaseUser.email?.toLowerCase();
          const isCEO = email === PLATFORM_ADMIN_EMAIL || firebaseUser.uid === 'x8rM4ioT6jTMU0rEfy2ujMQ0sFy1';
          setProfile({ role: isCEO ? 'admin' : 'student', approved: true });
          setIsProfileLoading(false);
          setIsAuthLoading(false);
        });
      } else {
        setUser(null);
        setProfile(null);
        setIsProfileLoading(false);
        setIsAuthLoading(false);
      }
    }, (error) => {
      setAuthError(error);
      setIsAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
        profileUnsubscribeRef.current = null;
      }
    };
  }, [auth, firestore]);

  const derivedRole = useMemo(() => {
    if (!user) return null;
    const email = user.email?.toLowerCase();
    const uid = user.uid;
    // Authority Shortcut: Instant role resolution for Master CEO
    if (email === PLATFORM_ADMIN_EMAIL || uid === 'x8rM4ioT6jTMU0rEfy2ujMQ0sFy1') return 'admin';
    return profile?.role || 'student';
  }, [user, profile]);

  const isApproved = useMemo(() => {
    if (!user) return null;
    if (derivedRole === 'teacher') return profile?.approved ?? false;
    return true;
  }, [user, derivedRole, profile]);

  const isLoading = isAuthLoading || isProfileLoading;

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user,
      role: derivedRole as any,
      approved: isApproved,
      isLoading,
      userError: authError,
    };
  }, [firebaseApp, firestore, auth, user, derivedRole, isApproved, isLoading, authError]);

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
        <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" />
        <h2 className="text-xl font-black font-headline tracking-tighter text-primary">FUSION8</h2>
        <p className="text-muted-foreground animate-pulse text-xs font-bold uppercase tracking-widest">Synchronizing Identity...</p>
      </div>
    );
  }

  if (user && derivedRole === 'teacher' && isApproved === false) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50 p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="bg-accent/10 p-6 rounded-full inline-block">
            <Clock className="h-16 w-16 text-accent animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold font-headline uppercase tracking-tighter">Instructor Vetting</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Your lecturer credentials are currently being reviewed by the platform administrators. 
            You'll receive full access once your **Matricule ID** is assigned.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.reload()} className="w-full h-12 font-bold">Check Status</Button>
            <Button onClick={() => signOut()} variant="outline" className="w-full h-12">Return Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase must be used within a FirebaseProvider.');
  return {
    firebaseApp: context.firebaseApp!,
    firestore: context.firestore!,
    auth: context.auth!,
    user: context.user,
    role: context.role,
    approved: context.approved,
    isLoading: context.isLoading,
    userError: context.userError,
  };
};

export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  role: 'student' | 'teacher' | 'admin' | null;
  approved: boolean | null;
  isLoading: boolean;
  userError: Error | null;
}

export const useAuth = (): FirebaseServicesAndUser => useFirebase();
export const useFirestore = (): Firestore => useFirebase().firestore;
export const useFirebaseApp = (): FirebaseApp => useFirebase().firebaseApp;

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T & {__memo?: boolean} {
  const memoized = useMemo(factory, deps) as T & {__memo?: boolean};
  if(typeof memoized === 'object' && memoized !== null) memoized.__memo = true;
  return memoized;
}

export const useUser = (): FirebaseServicesAndUser => useFirebase();