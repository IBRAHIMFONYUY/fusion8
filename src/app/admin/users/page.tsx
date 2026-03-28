'use client';

import { useEffect, useState } from 'react';
import { collection, query, doc, updateDoc, setDoc, serverTimestamp, where, getDocs, writeBatch } from 'firebase/firestore';
import { firestore, useAuth, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Check, X, ShieldCheck, Users as UsersIcon, Loader2, Unlock, AlertCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import type { UserProfile } from '@/lib/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function AdminUsersPage() {
    const { role, user: currentUser } = useAuth();
    const { toast } = useToast();
    
    const usersQuery = useMemoFirebase(() => {
        if (!firestore || role !== 'admin') return null;
        return query(collection(firestore, 'users'));
    }, [firestore, role]);

    const { data: userList, isLoading: usersLoading, error: usersError } = useCollection<UserProfile>(usersQuery);
    
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [isWiping, setIsWipeing] = useState(false);
    const [unlockUser, setUnlockUser] = useState<UserProfile | null>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');

    useEffect(() => {
        if (userList) {
            setUsers(userList);
            setLoading(false);
        } else if (!usersLoading) {
            setLoading(false);
        }
    }, [userList, usersLoading]);

    useEffect(() => {
        async function fetchCourses() {
            if (role === 'admin' && firestore) {
                try {
                    const snap = await getDocs(query(collection(firestore, 'courses'), where('status', '==', 'published')));
                    setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                } catch (err: any) {
                    if (err.code === 'permission-denied') {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({
                            path: 'courses',
                            operation: 'list',
                        }));
                    }
                }
            }
        }
        fetchCourses();
    }, [role]);

    const handlePlatformWipe = async () => {
        if (!firestore || !currentUser) return;
        setIsWipeing(true);
        try {
            const collections = ['users', 'enrollments', 'courses', 'cohort_applications', 'roles_admin', 'approved_teachers', 'notifications', 'assignments', 'submissions'];
            
            for (const colName of collections) {
                const snap = await getDocs(collection(firestore, colName));
                const batch = writeBatch(firestore);
                
                snap.docs.forEach((docSnap) => {
                    const isCEO = docSnap.id === currentUser.uid;
                    const isCEOMarker = colName === 'roles_admin' && docSnap.id === currentUser.uid;
                    
                    if (!isCEO && !isCEOMarker) {
                        batch.delete(docSnap.ref);
                    }
                });
                await batch.commit();
            }
            toast({ title: "Platform Reset Complete" });
        } catch (error: any) {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: 'platform_reset',
                    operation: 'delete',
                }));
            }
        } finally {
            setIsWipeing(false);
        }
    };

    const handleApproval = async (userId: string, approve: boolean) => {
        const userRef = doc(firestore, 'users', userId);
        try {
            if (approve) {
                const matricule = `F8-T-${Math.floor(10000 + Math.random() * 90000)}`;
                await updateDoc(userRef, {
                    approved: true,
                    matricule: matricule,
                    approvedAt: serverTimestamp()
                });
                await setDoc(doc(firestore, 'approved_teachers', userId), { 
                    active: true, 
                    updatedAt: serverTimestamp() 
                }, { merge: true });
                toast({ title: "Teacher Approved" });
            } else {
                await updateDoc(userRef, { approved: false });
            }
        } catch (error: any) {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'update',
                    requestResourceData: { approved: approve }
                }));
            }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-24">
                <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
                <p className="text-muted-foreground font-medium">Accessing user database...</p>
            </div>
        );
    }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">Platform Governance</h1>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="font-bold">
                    <Trash2 className="mr-2 h-4 w-4" /> Reset Platform Data
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will delete ALL users, courses, enrollments, and applications. Only your CEO admin account will be preserved.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Abort</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePlatformWipe} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Confirm Total Purge
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline">User Directory</CardTitle>
          <CardDescription>Vet teacher applications and manage platform participants.</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                          <span className="font-bold text-sm">{user.displayName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'teacher' ? 'secondary' : 'default'} className="capitalize">
                          {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.role === 'teacher' ? (
                          user.approved ? <Badge className="bg-green-500">Verified</Badge> : <Badge variant="outline" className="animate-pulse">Pending Review</Badge>
                      ) : <Badge variant="outline" className="opacity-40">System Access</Badge>}
                    </TableCell>
                    <TableCell>
                      {user.matricule ? (
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-accent" />
                            <span className="font-mono text-sm font-black">{user.matricule}</span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {user.role === 'teacher' && !user.approved && (
                          <>
                            <Button variant="outline" size="sm" className="text-green-600 border-green-600" onClick={() => handleApproval(user.id, true)}><Check className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleApproval(user.id, false)}><X className="h-4 w-4" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState icon={UsersIcon} title="No users found" description="Awaiting registrations." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
