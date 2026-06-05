'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // Keep instance in a stable ref instead of useMemo to survive React 18 concurrent mode strict evictions
  const firebaseServicesRef = React.useRef(typeof window !== 'undefined' ? initializeFirebase() : null);

  if (!firebaseServicesRef.current) {
    return null; // Await client hydration safely
  }
  const firebaseServices = firebaseServicesRef.current;

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}