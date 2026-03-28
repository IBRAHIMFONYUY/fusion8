
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMockStore } from '@/hooks/useMockStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UploadCloud, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


const proposalSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  problemStatement: z.string().min(50, 'Please describe the problem in at least 50 characters.'),
  proposedSolution: z.string().min(50, 'Please describe your solution in at least 50 characters.'),
  skillsNeeded: z.string().min(3, 'List at least one skill.'),
  proposalDoc: z.instanceof(File).optional(),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

const steps = [
  { id: 'Step 1', name: 'The Pitch' },
  { id: 'Step 2', name: 'The Details' },
  { id: 'Step 3', name: 'Final Touches' },
]

export default function ProposeVenturePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { addProposal } = useMockStore() as any;

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: '',
      problemStatement: '',
      proposedSolution: '',
      skillsNeeded: '',
    },
  });

  const onSubmit = async (data: ProposalFormValues) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newProposal = {
      id: Date.now(),
      studentLeadId: 1, // Mock current user
      title: data.title,
      problemStatement: data.problemStatement,
      proposedSolution: data.proposedSolution,
      skillsNeeded: data.skillsNeeded.split(',').map(s => s.trim()),
      submittedAt: new Date(),
      status: 'pending' as const
    };
    
    addProposal(newProposal);
    setIsSubmitting(false);

    toast({
      title: "Proposal Submitted!",
      description: "Your venture idea is now pending review by our instructors.",
    });

    setCurrentStep(prev => prev + 1); // Move to success step

     setTimeout(() => {
      router.push('/student/projects');
    }, 3000);
  };
  
  const processForm = async () => {
    // This function will trigger validation and move to the next step
    let isValid = false;
    if (currentStep === 0) {
      isValid = await form.trigger(['title', 'problemStatement']);
    } else if (currentStep === 1) {
      isValid = await form.trigger(['proposedSolution', 'skillsNeeded']);
    } else if (currentStep === 2) {
      isValid = true; // Final step, just needs submit
    }
    
    if (isValid && currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else if (isValid && currentStep === 2) {
      form.handleSubmit(onSubmit)();
    }
  };


  if (currentStep > 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="flex items-center justify-center h-16 w-16 bg-green-100 rounded-full mb-4">
            <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Submission Successful!</h2>
        <p className="text-muted-foreground max-w-md">Your proposal has been sent to our instructor panel for review. You'll be notified of its status. Redirecting you to the Project Hub...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Propose a New Venture</h1>
        <p className="text-muted-foreground">Turn your idea into a real-world project. Follow the steps to submit your proposal.</p>
      </div>

      <nav aria-label="Progress">
        <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0 mb-8">
          {steps.map((step, index) => (
            <li key={step.name} className="md:flex-1">
              {currentStep > index ? (
                <div className="group flex w-full flex-col border-l-4 border-accent py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                  <span className="text-sm font-medium text-accent transition-colors">{step.id}</span>
                  <span className="text-sm font-medium">{step.name}</span>
                </div>
              ) : currentStep === index ? (
                <div
                  className="flex w-full flex-col border-l-4 border-accent py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                  aria-current="step"
                >
                  <span className="text-sm font-medium text-accent">{step.id}</span>
                  <span className="text-sm font-medium">{step.name}</span>
                </div>
              ) : (
                <div className="group flex w-full flex-col border-l-4 border-gray-200 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                  <span className="text-sm font-medium text-gray-500 transition-colors">{step.id}</span>
                  <span className="text-sm font-medium">{step.name}</span>
                </div>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].name}</CardTitle>
          <CardDescription>
            {
                currentStep === 0 ? "Start with a compelling title and a clear problem statement." :
                currentStep === 1 ? "Describe your solution and the skills needed to build it." :
                "Add any supporting documents to help reviewers understand your vision."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {currentStep === 0 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venture Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 'Automated Irrigation System for Local Farmers'" {...field} />
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
                          <Textarea rows={6} placeholder="Describe a specific problem faced by a community or industry in your region. What is the current situation and why is it a problem?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="proposedSolution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Proposed Solution</FormLabel>
                        <FormControl>
                          <Textarea rows={6} placeholder="How will your project solve the problem you've identified? Describe the key features and benefits." {...field} />
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
                          <Input placeholder="e.g., 'Python, CAD Design, React, Marketing'" {...field} />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                            Enter a comma-separated list of skills required for this project.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <FormField
                    control={form.control}
                    name="proposalDoc"
                    render={({ field: { onChange, ...rest } }) => (
                      <FormItem>
                        <FormLabel>Proposal Document (Optional)</FormLabel>
                        <FormControl>
                           <div className="relative">
                                <Input 
                                    type="file" 
                                    className="pl-12" 
                                    onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                                    accept=".pdf,.doc,.docx"
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <UploadCloud className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </div>
                        </FormControl>
                         <p className="text-sm text-muted-foreground">Upload a more detailed document if you have one (PDF, DOC, DOCX).</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 0}>
                  Back
                </Button>
                <Button type="button" onClick={processForm} disabled={isSubmitting}>
                   {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Submitting...</> : (currentStep === 2 ? 'Submit Proposal' : 'Next Step')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
