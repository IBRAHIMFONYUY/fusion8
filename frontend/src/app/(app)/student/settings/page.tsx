'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, firestore } from '@/firebase/index';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Lock, User as UserIcon, LogOut, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function StudentSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form
  const [displayName, setDisplayName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Photo
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (user && user.displayName) setDisplayName(user.displayName);
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      return toast({ variant: 'destructive', title: 'Username required' });
    }

    setIsUpdatingProfile(true);
    try {
      // 1. Update Firebase Auth Object
      await updateProfile(user, { displayName });

      // 2. Update Firestore user document
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, { displayName });

      toast({ title: 'Profile Updated', description: 'Your username has been secured.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user || !user.email) return;
    if (!newPassword || newPassword !== confirmPassword) {
      return toast({ variant: 'destructive', title: 'Passwords must match' });
    }

    setIsUpdatingPassword(true);
    try {
      // Re-authenticate first to prevent security errors
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update Password
      await updatePassword(user, newPassword);

      toast({ title: 'Password Secured', description: 'Your security key has been updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        toast({ variant: 'destructive', title: 'Incorrect current password' });
      } else {
        toast({ variant: 'destructive', title: 'Security Error', description: error.message });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!user || !file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB restriction
       return toast({ variant: 'destructive', title: 'File too large', description: 'Please use an image under 2MB.' });
    }

    setIsUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `users/${user.uid}/avatar_${Date.now()}.${fileExt}`;
      const imgRef = storageRef(storage, fileName);

      await uploadBytes(imgRef, file);
      const photoURL = await getDownloadURL(imgRef);

      // Update Auth object & Firestore doc
      await updateProfile(user, { photoURL });
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, { photoURL });

      toast({ title: 'Avatar Synced', description: 'Your profile picture looks great!' });
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
    } finally {
       setIsUploadingPhoto(false);
    }
  };

  if (!user) {
      return (
          <div className="flex items-center justify-center p-24">
              <Loader2 className="animate-spin h-8 w-8 text-accent" />
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-up-fade">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline uppercase tracking-tighter text-primary">Identity Configuration</h1>
          <p className="text-muted-foreground text-sm uppercase font-bold tracking-widest mt-1">Manage your digital footprint & security credentials</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column - Avatar & Core Info */}
        <div className="space-y-6">
            <Card className="border-none shadow-xl bg-secondary/20 overflow-hidden text-center rounded-3xl">
                <CardHeader className="bg-secondary/40 border-b border-dashed flex flex-col items-center pt-8 pb-6">
                    <div className="relative group cursor-pointer mb-4" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-accent/20 transition-all group-hover:border-accent">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                                    <UserIcon className="h-12 w-12 text-accent/50" />
                                </div>
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {isUploadingPhoto ? <Loader2 className="animate-spin text-white h-6 w-6" /> : <Upload className="text-white h-6 w-6" />}
                            <span className="text-[10px] text-white font-bold uppercase tracking-wider mt-1">Change</span>
                        </div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handlePhotoUpload} 
                            disabled={isUploadingPhoto}
                        />
                    </div>
                    <CardTitle className="text-xl font-bold">{user.displayName || 'Anonymous User'}</CardTitle>
                    <CardDescription className="opacity-70">{user.email}</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4 text-left">
                        <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl">
                            <ShieldCheck className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="text-xs font-bold text-green-600 uppercase">Account Verified</p>
                                <p className="text-[10px] text-muted-foreground font-medium">Digital Campus Access</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Right Column - Forms */}
        <div className="md:col-span-2 space-y-6">
            <Card className="border-none shadow-md rounded-3xl overflow-hidden ring-1 ring-black/5">
                <CardHeader className="bg-secondary/10">
                    <CardTitle className="flex items-center gap-2"><UserIcon className="h-5 w-5 text-accent"/> Personal Display Name</CardTitle>
                    <CardDescription>Determine how instructors and peers identify you in the Hub.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2 max-w-sm">
                        <Label>Full Name / Username</Label>
                        <Input 
                            value={displayName} 
                            onChange={(e) => setDisplayName(e.target.value)} 
                            placeholder="John Doe" 
                            className="bg-secondary/30 border-transparent focus-visible:border-accent font-bold"
                        />
                        <p className="text-[10px] text-muted-foreground mt-2 italic">This name will appear on your final PDF Certificates.</p>
                    </div>
                    <Button 
                        onClick={handleUpdateProfile} 
                        disabled={isUpdatingProfile || !displayName.trim()}
                        className="font-bold bg-primary hover:bg-accent hover:text-accent-foreground rounded-xl"
                    >
                        {isUpdatingProfile ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : 'Synchronize Identity'}
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-none shadow-md rounded-3xl overflow-hidden ring-1 ring-black/5">
                <CardHeader className="bg-secondary/10">
                    <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-destructive"/> Security Integrity</CardTitle>
                    <CardDescription>Update your cryptographic access key. Requires current password verification.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2 max-w-sm">
                        <Label>Current System Password</Label>
                        <Input 
                            type="password"
                            value={currentPassword} 
                            onChange={(e) => setCurrentPassword(e.target.value)} 
                            placeholder="••••••••"
                            className="bg-secondary/30 border-transparent"
                        />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 max-w-xl">
                        <div className="space-y-2">
                            <Label>New Security Key</Label>
                            <Input 
                                type="password"
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)} 
                                placeholder="••••••••"
                                className="bg-secondary/30 border-transparent focus-visible:border-destructive"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm Key</Label>
                            <Input 
                                type="password"
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                placeholder="••••••••"
                                className="bg-secondary/30 border-transparent focus-visible:border-destructive"
                            />
                        </div>
                    </div>
                    
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                        <div className="flex items-center gap-2 text-destructive text-xs font-bold bg-destructive/10 p-2 rounded-lg max-w-xl">
                            <AlertTriangle className="h-4 w-4" /> Keys mismatch
                        </div>
                    )}
                    
                    <Button 
                        onClick={handleUpdatePassword} 
                        disabled={isUpdatingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                        variant="destructive"
                        className="font-bold rounded-xl shadow-lg shadow-destructive/20 mt-4"
                    >
                        {isUpdatingPassword ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : 'Rotate Credentials'}
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
