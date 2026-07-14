'use client';

import React, {
  DependencyList,
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { signOut, PLATFORM_ADMIN_EMAIL, PLATFORM_ADMIN_UID } from '@/lib/auth';
import { createSession } from '@/lib/auth-actions';
import { isCEO } from '@/lib/ceo';

function isCEOAccount(email: string | null | undefined, uid: string): boolean {
  return isCEO(email, uid, PLATFORM_ADMIN_EMAIL, PLATFORM_ADMIN_UID);
}

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export interface UserProfile {
  role: 'student' | 'teacher' | 'admin';
  approved?: boolean;
  displayName?: string;
  photoURL?: string;
  matricule?: string;
  onboardingCompleted?: boolean;
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

export const FirebaseContext = createContext<FirebaseContextState | undefined>(
  undefined
);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  const profileUnsubscribeRef = useRef<(() => void) | null>(null);
  const lastUidRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        // Always clean up the previous profile listener before setting a new one
        if (profileUnsubscribeRef.current) {
          profileUnsubscribeRef.current();
          profileUnsubscribeRef.current = null;
        }

        if (firebaseUser) {
          if (lastUidRef.current !== firebaseUser.uid) {
            setIsProfileLoading(true);
            lastUidRef.current = firebaseUser.uid;
            // Silently re-issue the __session cookie so middleware never rejects
            // a user whose cookie expired while Firebase kept them logged in.
            firebaseUser.getIdToken().then(idToken => {
              createSession(idToken).catch(() => {});
            });
          }
          setUser(firebaseUser);

          const profileRef = doc(firestore, 'users', firebaseUser.uid);

          profileUnsubscribeRef.current = onSnapshot(
            profileRef,
            (docSnap) => {
              if (docSnap.exists()) {
                setProfile(docSnap.data() as UserProfile);
              } else {
                // Auto-recovery for CEO or brand-new accounts where the profile
                // write hasn't replicated yet
                const ceo = isCEOAccount(firebaseUser.email, firebaseUser.uid);
                setProfile({ role: ceo ? 'admin' : 'student', approved: true });
              }
              setIsProfileLoading(false);
              setIsAuthLoading(false);
            },
            () => {
              // Permission error during profile load — graceful degradation
              const ceo = isCEOAccount(firebaseUser.email, firebaseUser.uid);
              setProfile({ role: ceo ? 'admin' : 'student', approved: true });
              setIsProfileLoading(false);
              setIsAuthLoading(false);
            }
          );
        } else {
          lastUidRef.current = null;
          setUser(null);
          setProfile(null);
          setIsProfileLoading(false);
          setIsAuthLoading(false);
        }
      },
      (error) => {
        setAuthError(error);
        setIsAuthLoading(false);
      }
    );

    return () => {
      unsubscribeAuth();
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
        profileUnsubscribeRef.current = null;
      }
    };
  }, [auth, firestore]);

  const derivedRole = useMemo((): 'student' | 'teacher' | 'admin' | null => {
    if (!user) return null;
    if (isCEOAccount(user.email, user.uid)) return 'admin';
    return profile?.role ?? 'student';
  }, [user, profile]);

  const isApproved = useMemo((): boolean | null => {
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
      role: derivedRole,
      approved: isApproved,
      isLoading,
      userError: authError,
    };
  }, [firebaseApp, firestore, auth, user, derivedRole, isApproved, isLoading, authError]);

  if (user && derivedRole === 'teacher' && isApproved === false) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50 p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="bg-accent/10 p-6 rounded-full inline-block">
            <Clock className="h-16 w-16 text-accent animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold font-headline uppercase tracking-tighter">
            Instructor Vetting
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Your lecturer credentials are currently under review by the platform
            administrators. You will receive full access once your{' '}
            <strong>Matricule ID</strong> is assigned.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.refresh()}
              className="w-full h-12 font-bold"
            >
              Check Status
            </Button>
            <Button
              onClick={() => { router.push('/'); signOut(); }}
              variant="outline"
              className="w-full h-12"
            >
              Return Home
            </Button>
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

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined)
    throw new Error('useFirebase must be used within a FirebaseProvider.');
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

export const useAuth = (): FirebaseServicesAndUser => useFirebase();
export const useFirestore = (): Firestore => useFirebase().firestore;
export const useFirebaseApp = (): FirebaseApp => useFirebase().firebaseApp;
export const useUser = (): FirebaseServicesAndUser => useFirebase();

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  return useMemo(() => {
    const result = factory();
    // Stamp __memo so useCollection's memoization guard passes.
    // Without this, useCollection throws on every non-null query.
    if (result !== null && result !== undefined && typeof result === 'object') {
      (result as any).__memo = true;
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
