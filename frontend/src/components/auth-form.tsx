"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/firebase';
import { signInUser, signUpUser, signInWithGoogle, UserRole } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Rocket, Loader2, Info, GraduationCap, User, MailCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const authSchema = z.object({
  name: z.string().min(2, 'Full name is required').optional().or(z.literal('')),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'teacher']).default('student'),
});

type AuthValues = z.infer<typeof authSchema>;

export function AuthForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('redirect') ?? searchParams.get('returnTo');
  
  const [isPending, setIsPending] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  const form = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      role: 'student',
    },
  });

  const handleGoogleSignIn = async () => {
    setIsPending(true);
    setErrorHint(null);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        toast({ title: "Welcome back!", description: "Accessing your secure workspace..." });
        const target = returnTo || `/${result.role}/dashboard`;
        router.push(target);
        // Keep loading state active - the login page will handle the redirect
      } else {
        const errorMsg = (result as any).error;
        if (errorMsg.includes('auth/popup-blocked') || errorMsg.includes('popup')) {
          setErrorHint("Popups are blocked by your browser. Please allow popups for this site to sign in with Google.");
        } else if (errorMsg.includes('auth/account-exists-with-different-credential')) {
          setErrorHint("An account already exists with the same email but different sign-in credentials. Please sign in using email and password.");
        } else {
          toast({ variant: "destructive", title: "Google Login Failed", description: errorMsg });
        }
        setIsPending(false);
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked' || err?.message?.includes('popup')) {
        setErrorHint("Popups are blocked by your browser. Please allow popups for this site.");
      } else if (err?.code === 'auth/network-request-failed') {
        setErrorHint("Network interrupted. Please check your connection and try again.");
      } else {
        toast({ variant: "destructive", title: "Error", description: "Could not connect to Google services." });
      }
      setIsPending(false);
    }
  };

  const handleResendVerification = async () => {
    setIsPending(true);
    try {
      // Try to sign in temporarily to get the user object, then send verification
      const email = resendEmail || form.getValues('email');
      const password = form.getValues('password');
      if (!email) {
        toast({ variant: 'destructive', title: 'Email required', description: 'Enter your email and password above, then click resend.' });
        setIsPending(false);
        return;
      }
      // Use Firebase directly to resend — if the user is already signed in
      const currentUser = auth.currentUser;
      if (currentUser) {
        await sendEmailVerification(currentUser);
        toast({ title: 'Verification Sent', description: 'Check your inbox (and spam folder) for the new verification link.' });
      } else {
        toast({ title: 'Enter your password too', description: 'Fill in both email and password then try signing in again — the verification prompt will include a resend option.' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Could not resend', description: 'Please try again in a few minutes.' });
    } finally {
      setIsPending(false);
      setShowResendVerification(false);
    }
  };

  const onSubmit = async (values: AuthValues) => {
    setIsPending(true);
    setErrorHint(null);
    
    try {
      if (activeTab === 'register') {
        const result = await signUpUser(values.email, values.password, values.name || 'User', values.role);
        if (result.success) {
          if ((result as any).requiresVerification) {
            toast({ title: "Account Created", description: "Please check your email to verify your account before signing in." });
            setActiveTab('login');
            setIsPending(false);
          } else {
            toast({ title: "Account Created", description: `Welcome to Fusion8 as a ${values.role}.` });
            router.push(returnTo || `/${result.role}/dashboard`);
            // Keep loading state active - the login page will handle the redirect
          }
        } else {
          toast({ variant: "destructive", title: "Registration failed", description: (result as any).error });
          setIsPending(false);
        }
      } else {
        const result = await signInUser(values.email, values.password);
        if (result.success) {
          toast({ title: "Identity Verified", description: `Welcome back, ${result.role}.` });
          router.push(returnTo || `/${result.role}/dashboard`);
          // Keep loading state active - the login page will handle the redirect
        } else {
          const errMsg = (result as any).error as string;
          // Detect email-not-verified error and offer resend
          if (errMsg?.includes('verify your email')) {
            setResendEmail(values.email);
            setShowResendVerification(true);
          }
          toast({ variant: "destructive", title: "Login failed", description: errMsg });
          setIsPending(false);
        }
      }
    } catch (error: any) {
      if (error?.code === 'auth/network-request-failed') {
        setErrorHint("Network interrupted. Please check your connection and try again.");
      } else {
        toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
      }
      setIsPending(false);
    }
  };

  return (
    <Card className="w-full max-w-sm sm:max-w-md shadow-2xl border-none">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-3xl flex items-center justify-center gap-2 font-headline font-black">
            <Rocket className="text-accent h-8 w-8"/> FUSION8
        </CardTitle>
        <CardDescription>
          {activeTab === 'login' ? 'Enter your secure access credentials.' : 'Choose your role and join the accelerator.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showResendVerification && (
          <Alert className="mb-4 bg-blue-500/10 border-blue-500/20">
            <MailCheck className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center justify-between gap-2 flex-wrap">
              <span>Email not verified. Didn't receive it?</span>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isPending}
                className="font-bold underline underline-offset-2 whitespace-nowrap"
              >
                Resend verification
              </button>
            </AlertDescription>
          </Alert>
        )}
        {errorHint && (
          <Alert className="mb-6 bg-accent/10 border-accent/20 text-accent">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs font-medium">{errorHint}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3 sm:space-y-4 mb-6">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full h-9 sm:h-10 flex items-center justify-center gap-3 font-semibold border-2"
            onClick={handleGoogleSignIn}
            disabled={isPending}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google Sign In
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-medium">Or use credentials</span>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <Tabs 
              value={activeTab} 
              onValueChange={(v) => setActiveTab(v as 'login' | 'register')} 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-secondary h-12">
                <TabsTrigger value="login" className="data-[state=active]:bg-background">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-background">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 pt-6 outline-none">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="name@fusion8.com" {...field} className="h-11" disabled={isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Access Password</FormLabel>
                        <Link
                          href="/forgot-password"
                          className="text-xs font-medium text-muted-foreground hover:text-accent transition-colors"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="h-11" disabled={isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-9 sm:h-10 text-base font-bold bg-primary hover:bg-primary/90" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Verify & Enter"}
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 pt-6 outline-none">


                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="h-11" disabled={isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} className="h-11" disabled={isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Choose Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="h-11" disabled={isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full h-11 text-base font-bold bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Create Portal"}
                </Button>


              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
