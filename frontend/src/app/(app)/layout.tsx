import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function AppGroupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
}
