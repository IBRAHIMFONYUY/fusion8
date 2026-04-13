
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Check, Loader2, User, Briefcase, Phone, BookOpen, Heart, Target, Lightbulb, Award, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/firebase';
import { useRouter } from 'next/navigation';

export default function BecomeInstructorPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        experience: '',
        subjects: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setIsSubmitting(true);
        
        try {
            await addDoc(collection(firestore, 'teacher_applications'), {
                fullName: formData.fullName,
                email: formData.email.toLowerCase(),
                phone: formData.phone,
                experience: formData.experience,
                subjects: formData.subjects,
                status: 'pending',
                appliedAt: serverTimestamp(),
            });
            
            toast({
                title: "Application Received!",
                description: "Your application is under review. You'll receive an email once approved.",
            });
            setStep(2);
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: "An unexpected error occurred." });
        } finally {
            setIsSubmitting(false);
        }
    }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-secondary">
        <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary">
                    Forge the Next Generation of African Innovators
                </h1>
                <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                    Don’t just teach code. Inspire a movement. At Fusion8, we are on a mission to bridge the skills gap in Cameroon.
                </p>
            </div>

            {/* Application Process Section */}
             <div className="py-16 md:py-24">
                <div className="relative mt-16">
                    <div className="hidden md:block absolute top-1/2 -translate-y-1/2 left-0 right-0 h-px bg-border border-dashed" />
                    <div className="relative grid md:grid-cols-3 gap-12">
                         <div className="flex flex-col items-center text-center">
                            <div className="flex items-center justify-center h-20 w-20 rounded-full bg-background border-4 border-secondary mb-4">
                                <span className="text-3xl font-bold text-accent">1</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Create Your Account</h3>
                            <p className="text-muted-foreground text-sm">Sign up as a Lecturer to gain access to the course builder and dashboard.</p>
                        </div>
                         <div className="flex flex-col items-center text-center">
                             <div className="flex items-center justify-center h-20 w-20 rounded-full bg-background border-4 border-secondary mb-4">
                                <span className="text-3xl font-bold text-accent">2</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Build Your Course</h3>
                            <p className="text-muted-foreground text-sm">Use our Smart Course Wizard to upload your curriculum and YouTube videos.</p>
                        </div>
                         <div className="flex flex-col items-center text-center">
                           <div className="flex items-center justify-center h-20 w-20 rounded-full bg-background border-4 border-secondary mb-4">
                                <span className="text-3xl font-bold text-accent">3</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Admin Approval</h3>
                            <p className="text-muted-foreground text-sm">Once your course is ready, submit it for review. We approve quality content within 48 hours.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <Card className="max-w-4xl mx-auto mt-12 shadow-xl" id="application-form">
                 {step === 1 ? (
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle>Lecturer Application</CardTitle>
                            <CardDescription>Tell us about yourself. If approved, you can register using the email provided.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2"><User className="text-accent" /> Account Information</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input id="fullName" placeholder="Jane Doe" required value={formData.fullName} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" type="email" placeholder="you@example.com" required value={formData.email} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input id="phone" type="tel" placeholder="+237 XXX XXX XXX" required value={formData.phone} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2"><Briefcase className="text-accent" /> Professional Background</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="experience">Relevant Experience</Label>
                                    <Textarea id="experience" placeholder="Describe your professional and teaching experience." required rows={3} value={formData.experience} onChange={handleInputChange}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subjects">Passionate Subjects</Label>
                                    <Input id="subjects" placeholder="e.g., Full-Stack Web Dev with Next.js" required value={formData.subjects} onChange={handleInputChange} />
                                </div>
                            </div>
                             <div className="flex justify-end">
                                <Button size="lg" type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
                                        </>
                                    ) : (
                                        'Submit Application'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                 ) : (
                    <CardContent className="p-12 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold">Application Received!</h2>
                        <p className="text-muted-foreground mt-2 max-w-md mx-auto">Your application is now under review by our administration. We will contact you at your email. Once approved, you can register for an account using this email!</p>
                        <Button asChild variant="outline" className="mt-6">
                            <a href="/">Return Home</a>
                        </Button>
                    </CardContent>
                 )}
            </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
