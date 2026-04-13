
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
    phone: '',
    ageLocation: '',
    currentSkills: '',
    expectations: '',
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
        phone: formData.phone,
        ageLocation: formData.ageLocation,
        currentSkills: formData.currentSkills,
        expectations: formData.expectations,
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
            <p className="text-muted-foreground mt-2">Apply for our intensive 7-week onsite engineering program in Yaoundé. The program culminates in building and submitting a valuable, real-world project.</p>
          </div>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>Accelerator Application</CardTitle>
              <CardDescription>Tell us about your background and what you hope to achieve during the 7 weeks.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" placeholder="John Doe" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+237 XXX XXX XXX" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ageLocation">Age & Location</Label>
                  <Input id="ageLocation" placeholder="e.g., 22, Yaoundé" required value={formData.ageLocation} onChange={e => setFormData({...formData, ageLocation: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentSkills">What You Know</Label>
                  <Textarea id="currentSkills" placeholder="List your current technical skills or domain knowledge. It's okay if you are a beginner!" required rows={3} value={formData.currentSkills} onChange={e => setFormData({...formData, currentSkills: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectations">Expectations & Final Project</Label>
                  <Textarea id="expectations" placeholder="What do you hope to learn in these 7 weeks? Do you have an idea for the final valuable project you will submit?" required rows={4} value={formData.expectations} onChange={e => setFormData({...formData, expectations: e.target.value})} />
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
