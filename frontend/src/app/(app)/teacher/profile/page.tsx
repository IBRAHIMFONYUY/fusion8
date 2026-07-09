'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { firestore, auth } from '@/firebase';
import { useAuth } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  User, BookOpen, GraduationCap, Loader2, Save, Lock,
  ShieldCheck, Mail, Calendar, Edit3,
} from 'lucide-react';

export default function TeacherProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState('');
  const [linkedIn, setLinkedIn] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!user || !firestore) return;

    async function load() {
      try {
        const snap = await getDoc(doc(firestore!, 'users', user!.uid));
        if (snap.exists()) {
          const data = snap.data();
          setProfile(data);
          setDisplayName(data.displayName ?? '');
          setBio(data.bio ?? '');
          setExpertise(data.expertise ?? '');
          setLinkedIn(data.linkedIn ?? '');
        }

        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(firestore!, 'courses'), where('teacherId', '==', user!.uid));
        const snap2 = await getDocs(q);
        setCourses(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch {
        // permission errors handled by global emitter
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user || !firestore) return;
    setSavingProfile(true);
    try {
      await updateDoc(doc(firestore, 'users', user.uid), {
        displayName: displayName.trim(),
        bio: bio.trim(),
        expertise: expertise.trim(),
        linkedIn: linkedIn.trim(),
        updatedAt: serverTimestamp(),
      });
      await updateProfile(user, { displayName: displayName.trim() });
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
    } catch {
      toast({ variant: 'destructive', title: 'Save failed', description: 'Please try again.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !auth.currentUser) return;
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Password too short', description: 'Minimum 6 characters.' });
      return;
    }
    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Password changed', description: 'Your new password is active.' });
    } catch (err: any) {
      const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Current password is incorrect.'
        : 'Could not update password. Try again.';
      toast({ variant: 'destructive', title: 'Update failed', description: msg });
    } finally {
      setSavingPassword(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  const publishedCount = courses.filter(c => c.status === 'published').length;
  const draftCount = courses.filter(c => c.status === 'draft').length;
  const pendingCount = courses.filter(c => c.status === 'pending').length;
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'T';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black font-headline tracking-tighter uppercase">Instructor Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your public profile and account security.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-none shadow-md rounded-2xl text-center p-4">
          <div className="text-3xl font-black text-accent">{publishedCount}</div>
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Published</div>
        </Card>
        <Card className="border-none shadow-md rounded-2xl text-center p-4">
          <div className="text-3xl font-black">{draftCount}</div>
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Drafts</div>
        </Card>
        <Card className="border-none shadow-md rounded-2xl text-center p-4">
          <div className="text-3xl font-black text-orange-500">{pendingCount}</div>
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Pending</div>
        </Card>
      </div>

      {/* Profile info */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-secondary/30 border-b border-dashed">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border-2 border-accent/20 flex items-center justify-center text-2xl font-black text-accent flex-shrink-0">
              {initials}
            </div>
            <div>
              <CardTitle className="text-xl">{displayName || 'Your Name'}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="h-3 w-3" /> {user?.email}
                <Badge variant="secondary" className="ml-1 text-[10px] font-bold uppercase">
                  <ShieldCheck className="h-2.5 w-2.5 mr-1 text-green-500" /> Teacher
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your full name"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                value={linkedIn}
                onChange={e => setLinkedIn(e.target.value)}
                placeholder="https://linkedin.com/in/yourname"
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expertise">Areas of Expertise</Label>
            <Input
              id="expertise"
              value={expertise}
              onChange={e => setExpertise(e.target.value)}
              placeholder="e.g. Robotics, Embedded Systems, MATLAB"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell students about your background and teaching philosophy..."
              rows={4}
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="font-bold bg-primary hover:bg-primary/90 h-11 px-8"
          >
            {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Password change */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-secondary/30 border-b border-dashed">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-accent" /> Change Password
          </CardTitle>
          <CardDescription>Update your account password. You'll need your current password to confirm.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPw">Current Password</Label>
            <Input
              id="currentPw"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPw">New Password</Label>
              <Input
                id="newPw"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPw">Confirm New Password</Label>
              <Input
                id="confirmPw"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11"
              />
            </div>
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            variant="outline"
            className="font-bold border-2 rounded-xl h-11 px-8"
          >
            {savingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
