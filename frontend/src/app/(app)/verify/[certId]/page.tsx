'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/firebase';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CheckCircle, XCircle, Loader2, Rocket, Shield, GraduationCap, Calendar, Hash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface CertificateData {
  certId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  issuedAt: any;
  grade?: string;
}

export default function VerifyCertificatePage() {
  const params = useParams<{ certId: string }>();
  const [state, setState] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [cert, setCert] = useState<CertificateData | null>(null);

  useEffect(() => {
    if (!params?.certId || !firestore) return;

    async function verify() {
      try {
        const q = query(
          collection(firestore!, 'certificates'),
          where('certId', '==', params.certId)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          setState('invalid');
          return;
        }
        const data = snap.docs[0].data() as CertificateData;
        setCert(data);
        setState('valid');
      } catch {
        setState('invalid');
      }
    }

    verify();
  }, [params?.certId]);

  const issueDate = cert?.issuedAt
    ? format(cert.issuedAt.toDate ? cert.issuedAt.toDate() : new Date(cert.issuedAt), 'MMMM d, yyyy')
    : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center bg-secondary py-12 px-4">
        <div className="w-full max-w-lg">

          {/* Branding */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Rocket className="h-6 w-6 text-accent" />
            <span className="font-black text-xl tracking-tighter uppercase">Fusion8</span>
            <span className="text-muted-foreground text-sm ml-1">Certificate Verification</span>
          </div>

          {state === 'loading' && (
            <Card className="border-none shadow-2xl">
              <CardContent className="flex flex-col items-center gap-4 py-16">
                <Loader2 className="h-10 w-10 animate-spin text-accent" />
                <p className="text-muted-foreground font-medium">Verifying certificate…</p>
              </CardContent>
            </Card>
          )}

          {state === 'valid' && cert && (
            <Card className="border-none shadow-2xl overflow-hidden">
              {/* Green header band */}
              <div className="bg-green-600 dark:bg-green-700 px-6 py-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-lg leading-tight">Certificate Verified</p>
                  <p className="text-green-100 text-sm">This certificate is authentic and was issued by Fusion8.</p>
                </div>
              </div>

              <CardContent className="p-6 space-y-5">
                {/* Certificate details */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Awarded to</p>
                      <p className="font-black text-xl">{cert.studentName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Course Completed</p>
                      <p className="font-bold text-base">{cert.courseTitle}</p>
                    </div>
                  </div>

                  {issueDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Date Issued</p>
                        <p className="font-semibold">{issueDate}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Hash className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Certificate ID</p>
                      <p className="font-mono text-sm text-muted-foreground">{cert.certId}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none font-bold">
                    <CheckCircle className="h-3 w-3 mr-1" /> Authentic Fusion8 Certificate
                  </Badge>
                </div>

                <Button asChild variant="outline" className="w-full font-bold border-2 rounded-xl">
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {state === 'invalid' && (
            <Card className="border-none shadow-2xl overflow-hidden">
              <div className="bg-destructive/90 px-6 py-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <XCircle className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-lg leading-tight">Certificate Not Found</p>
                  <p className="text-red-100 text-sm">This certificate ID does not exist in our records.</p>
                </div>
              </div>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  The certificate ID <code className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">{params?.certId}</code> was not found.
                  This could mean the certificate is invalid, has been revoked, or the ID was copied incorrectly.
                </p>
                <p className="text-sm text-muted-foreground">
                  If you believe this is an error, contact us at <a href="mailto:support@fusion8.tech" className="text-accent font-semibold hover:underline">support@fusion8.tech</a>.
                </p>
                <Button asChild variant="outline" className="w-full font-bold border-2 rounded-xl">
                  <Link href="/">Return to Fusion8</Link>
                </Button>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
