
'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, firestore } from '@/firebase';
import { Loader2, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';

type UserRole = 'student' | 'teacher' | 'admin';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  approved: boolean | null;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  approved: null,
  isLoading: true,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [approved, setApproved] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const profileUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
        profileUnsubscribeRef.current = null;
      }

      if (firebaseUser) {
        profileUnsubscribeRef.current = onSnapshot(
          doc(firestore, 'users', firebaseUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setRole(data.role as UserRole);
              setApproved(data.approved ?? false);
            } else {
              setRole('student');
              setApproved(true);
            }
            setIsLoading(false);
          },
          (err) => {
            console.error("Profile sync error:", err);
            setRole('student');
            setApproved(true);
            setIsLoading(false);
          }
        );
      } else {
        setRole(null);
        setApproved(null);
        setIsLoading(false);
      }
    }, (err) => {
      console.error("Auth state error:", err);
      setError("Authentication service unavailable.");
      setIsLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (profileUnsubscribeRef.current) profileUnsubscribeRef.current();
    };
  }, []);

  // Handle unapproved teacher state
  if (!isLoading && user && role === 'teacher' && approved === false) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50 p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="bg-accent/10 p-6 rounded-full inline-block">
            <Clock className="h-16 w-16 text-accent animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold">Registration Under Review</h2>
          <p className="text-muted-foreground text-lg">
            Welcome to Fusion8! Your teacher application has been received. 
            Our administration is currently reviewing your credentials. 
          </p>
          <div className="bg-secondary p-4 rounded-lg text-sm text-left border border-dashed">
            <p className="font-bold mb-1">What's next?</p>
            <p>Once approved, you will receive your unique <strong>Matricule ID</strong> via email. You'll then be able to access the course builder and manage your curriculum.</p>
          </div>
          <Button onClick={() => signOut()} variant="outline" className="w-full">
            Sign Out & Return Later
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, role, approved, isLoading, error }}>
      {isLoading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50 pointer-events-auto">
          <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" />
          <h2 className="text-xl font-bold">Fusion8</h2>
          <p className="text-muted-foreground animate-pulse">Connecting to classroom...</p>
        </div>
      )}
      {error ? (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-4 text-center z-50">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connection Issue</h2>
          <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry Connection</Button>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}
