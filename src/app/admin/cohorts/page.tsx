'use client';

import { useEffect, useState } from 'react';
import { collection, query, doc, updateDoc, setDoc, serverTimestamp, getDocs, where } from 'firebase/firestore';
import { firestore, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, Eye, GraduationCap, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function AdminCohortsPage() {
  const { role } = useAuth();
  const { toast } = useToast();
  
  const cohortsQuery = useMemoFirebase(() => {
    if (!firestore || role !== 'admin') return null;
    return query(collection(firestore, 'cohort_applications'));
  }, [firestore, role]);

  const { data: appsList, isLoading: cohortsLoading } = useCollection<any>(cohortsQuery);

  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (appsList) {
      setApps(appsList);
      setLoading(false);
    } else if (!cohortsLoading) {
      setLoading(false);
    }
  }, [appsList, cohortsLoading]);

  const handleApproval = async (app: any, approve: boolean) => {
    setIsProcessing(true);
    try {
      const appRef = doc(firestore, 'cohort_applications', app.id);
      
      if (approve) {
        await updateDoc(appRef, { status: 'approved', processedAt: serverTimestamp() });

        const coursesSnap = await getDocs(query(collection(firestore, 'courses'), where('status', '==', 'published')));
        
        const enrollmentPromises = coursesSnap.docs.map(cDoc => {
          const enrollmentId = `${app.studentId}_${cDoc.id}`;
          return setDoc(doc(firestore, 'enrollments', enrollmentId), {
            id: enrollmentId,
            studentId: app.studentId,
            courseId: cDoc.id,
            status: 'active',
            progress: 0,
            enrolledAt: serverTimestamp(),
            scholarship: true,
            grantSource: 'cohort_01_admission'
          }, { merge: true });
        });

        await Promise.all(enrollmentPromises);
        toast({ title: "Admission Granted", description: "Scholarship direct access enabled for full curriculum." });
      } else {
        await updateDoc(appRef, { status: 'rejected', processedAt: serverTimestamp() });
        toast({ title: "Admission Declined", description: "Application marked as rejected." });
      }
      setSelectedApp(null);
    } catch (error) {
      // Errors handled centrally
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="flex flex-col items-center justify-center p-24 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
      <p className="text-muted-foreground font-medium">Retrieving student pitches...</p>
    </div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Cohort 01 Admissions</h1>
      
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle>Onsite Accelerator Applicants</CardTitle>
          <CardDescription>Review student engineering pitches. Approval grants immediate scholarship access.</CardDescription>
        </CardHeader>
        <CardContent>
          {apps.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map(app => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.fullName}</TableCell>
                    <TableCell className="text-xs font-mono">{app.email}</TableCell>
                    <TableCell>
                      <Badge variant={app.status === 'approved' ? 'default' : app.status === 'pending' ? 'secondary' : 'destructive'}>
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedApp(app)}>
                        <Eye className="h-4 w-4 mr-2" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground italic border-2 border-dashed rounded-lg">
              No onsite applications found in the intake queue.
            </div>
          )}
        </CardContent>
      </Card>

      {selectedApp && (
        <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Admission Review: {selectedApp.fullName}</DialogTitle>
              <DialogDescription>Candidate for Yaoundé Hardware Lab Accelerator</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-secondary/50 rounded-lg border border-dashed">
                <Label className="text-[10px] uppercase font-black text-accent tracking-widest">Project Vision</Label>
                <p className="mt-1 text-sm font-medium leading-relaxed">{selectedApp.projectIdea}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Candidate Motivation</Label>
                <p className="mt-1 text-sm italic">"{selectedApp.reason}"</p>
              </div>
              {selectedApp.status === 'pending' && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Approving grants immediate scholarship access to the entire digital curriculum.</span>
                </div>
              )}
            </div>
            <DialogFooter>
              {selectedApp.status === 'pending' && (
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1 text-red-600 hover:bg-red-50" onClick={() => handleApproval(selectedApp, false)} disabled={isProcessing}>
                    <X className="mr-2 h-4 w-4" /> Reject
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApproval(selectedApp, true)} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : <><Check className="mr-2 h-4 w-4" /> Admit & Enroll</>}
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
