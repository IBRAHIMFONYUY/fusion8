'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UploadCloud, Check, Loader2, Lightbulb, Wrench, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const proposalSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  problemStatement: z.string().min(50, 'Describe the problem in at least 50 characters.'),
  proposedSolution: z.string().min(50, 'Describe your solution in at least 50 characters.'),
  skillsNeeded: z.string().min(3, 'List at least one skill.'),
  proposalDoc: z.instanceof(File).optional(),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

const steps = [
  { id: '01', name: 'The Problem', icon: Lightbulb, desc: 'Define a real local challenge worth solving.' },
  { id: '02', name: 'Your Solution', icon: Wrench, desc: 'Describe your approach and the team you need.' },
  { id: '03', name: 'Final Submission', icon: Rocket, desc: 'Attach supporting documents and launch.' },
];

export default function ProposeVenturePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user, firestore } = useAuth();

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { title: '', problemStatement: '', proposedSolution: '', skillsNeeded: '' },
  });

  const onSubmit = async (data: ProposalFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Not authenticated', description: 'Please sign in to submit a proposal.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'project_proposals'), {
        title: data.title,
        problemStatement: data.problemStatement,
        proposedSolution: data.proposedSolution,
        skillsNeeded: data.skillsNeeded.split(',').map(s => s.trim()).filter(Boolean),
        studentLeadId: user.uid,
        studentName: user.displayName || user.email,
        status: 'pending',
        submittedAt: serverTimestamp(),
      });

      toast({
        title: 'Proposal Submitted!',
        description: 'Your venture idea is now pending review by our instructors.',
      });

      setCurrentStep(3);
      setTimeout(() => router.push('/student/projects'), 3000);
    } catch {
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const processForm = async () => {
    let isValid = false;
    if (currentStep === 0) isValid = await form.trigger(['title', 'problemStatement']);
    else if (currentStep === 1) isValid = await form.trigger(['proposedSolution', 'skillsNeeded']);
    else if (currentStep === 2) isValid = true;

    if (isValid && currentStep < 2) setCurrentStep(currentStep + 1);
    else if (isValid && currentStep === 2) form.handleSubmit(onSubmit)();
  };

  // Success state
  if (currentStep === 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-500/15 rounded-2xl flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold font-headline">Proposal Submitted!</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            Your venture idea is now under instructor review. You'll be notified once a decision is made.
            Redirecting to the Project Hub…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold font-headline tracking-tight">Propose a Venture</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Turn your engineering idea into a real project in the FUSION8 innovation ecosystem.
        </p>
      </div>

      {/* Step indicator */}
      <div className="grid sm:grid-cols-3 gap-3">
        {steps.map((step, index) => {
          const isActive = currentStep === index;
          const isDone = currentStep > index;
          return (
            <div
              key={step.id}
              className={`rounded-2xl p-4 border transition-all ${
                isActive
                  ? 'border-accent bg-accent/5'
                  : isDone
                  ? 'border-green-300 bg-green-50 dark:bg-green-500/10 dark:border-green-500/30'
                  : 'border-border bg-card opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold ${
                    isActive ? 'bg-accent text-white' : isDone ? 'bg-green-500 text-white' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <div>
                  <p className="text-xs font-bold">{step.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{step.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form card */}
      <Card className="border border-border bg-card rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold font-headline">{steps[currentStep].name}</CardTitle>
          <CardDescription className="text-sm">
            {currentStep === 0
              ? 'Start with a compelling title and a clear problem statement.'
              : currentStep === 1
              ? 'Describe your solution and the skills required.'
              : 'Attach any supporting documents to strengthen your proposal.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {currentStep === 0 && (
                <>
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venture Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Automated Irrigation System for Local Farmers" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="problemStatement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>The Local Problem</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={6}
                            placeholder="Describe a specific problem faced by a community or industry in your region. What is the current situation and why does it matter?"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {currentStep === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="proposedSolution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Proposed Solution</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={6}
                            placeholder="How will your project solve the problem? Describe the key features, tech stack, and impact."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="skillsNeeded"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skills Needed</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Python, Arduino, React, CAD Design, Marketing" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Comma-separated list of skills needed to build this.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {currentStep === 2 && (
                <FormField
                  control={form.control}
                  name="proposalDoc"
                  render={({ field: { onChange } }) => (
                    <FormItem>
                      <FormLabel>Proposal Document (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="file"
                            className="pl-12"
                            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                            accept=".pdf,.doc,.docx"
                          />
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <UploadCloud className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Upload a detailed brief if you have one (PDF, DOC, DOCX).</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(s => s - 1)}
                  disabled={currentStep === 0}
                  className="rounded-xl"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={processForm}
                  disabled={isSubmitting}
                  className="bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl px-8"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</>
                  ) : currentStep === 2 ? (
                    <><Rocket className="mr-2 h-4 w-4" /> Submit Proposal</>
                  ) : (
                    'Next Step →'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
