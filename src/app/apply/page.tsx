
'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/firebase';
import { Loader2, CheckCircle2, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CohortApplyPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    projectIdea: '',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login?returnTo=/apply');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'cohort_applications'), {
        studentId: user.uid,
        email: user.email,
        fullName: formData.fullName,
        projectIdea: formData.projectIdea,
        reason: formData.reason,
        status: 'pending',
        appliedAt: serverTimestamp(),
      });
      setSubmitted(true);
      toast({ title: "Application Received", description: "Our mentors will review your pitch soon." });
    } catch (error) {
      toast({ variant: 'destructive', title: "Submission Failed", description: "Could not save your application." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-secondary p-4">
          <Card className="max-w-md text-center p-8 border-none shadow-2xl">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Pitch Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              You are now in the review queue for Cohort 01. We'll contact you at <strong>{user?.email}</strong> once the review is complete.
            </p>
            <Button onClick={() => router.push('/student/dashboard')} className="w-full">Back to Dashboard</Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-secondary py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight font-headline">Join Cohort 01</h1>
            <p className="text-muted-foreground mt-2">Apply for onsite hardware labs and elite mentorship in Yaoundé.</p>
          </div>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>Accelerator Application</CardTitle>
              <CardDescription>Tell us about the engineering problem you want to solve.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    placeholder="John Doe" 
                    required 
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectIdea">Your Project Vision</Label>
                  <Textarea 
                    id="projectIdea" 
                    placeholder="What real-world solution do you want to build during the 12 weeks?" 
                    required 
                    rows={4}
                    value={formData.projectIdea}
                    onChange={e => setFormData({...formData, projectIdea: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Why Fusion8?</Label>
                  <Textarea 
                    id="reason" 
                    placeholder="Why are you ready for this intensive onsite experience?" 
                    required 
                    value={formData.reason}
                    onChange={e => setFormData({...formData, reason: e.target.value})}
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-lg font-bold bg-accent hover:bg-accent/90" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transmitting...</> : 'Submit Application'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
