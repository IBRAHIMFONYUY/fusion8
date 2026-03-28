"use client";

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInUser, signUpUser, signInWithGoogle, UserRole } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Rocket, Loader2, Info, GraduationCap, User } from 'lucide-react';
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
  const returnTo = searchParams.get('returnTo');
  
  const [isPending, setIsPending] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [errorHint, setErrorHint] = useState<string | null>(null);

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
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        toast({ title: "Welcome back!", description: "Accessing your secure workspace..." });
        const target = returnTo || `/${result.role}/dashboard`;
        window.location.href = target;
      } else {
        toast({ variant: "destructive", title: "Google Login Failed", description: (result as any).error });
        setIsPending(false);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not connect to Google services." });
      setIsPending(false);
    }
  };

  const onSubmit = async (values: AuthValues) => {
    setIsPending(true);
    setErrorHint(null);
    
    try {
      if (activeTab === 'register') {
        const result = await signUpUser(values.email, values.password, values.name || 'User', values.role);
        if (result.success) {
          toast({ title: "Account Created", description: `Welcome to Fusion8 as a ${values.role}.` });
          window.location.href = returnTo || `/${result.role}/dashboard`;
        } else {
          toast({ variant: "destructive", title: "Registration failed", description: (result as any).error });
          setIsPending(false);
        }
      } else {
        const result = await signInUser(values.email, values.password);
        if (result.success) {
          toast({ title: "Identity Verified", description: `Welcome back, ${result.role}.` });
          window.location.href = returnTo || `/${result.role}/dashboard`;
        } else {
          toast({ variant: "destructive", title: "Login failed", description: (result as any).error });
          setIsPending(false);
        }
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
      setIsPending(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-none">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-3xl flex items-center justify-center gap-2 font-headline font-black">
            <Rocket className="text-accent h-8 w-8"/> FUSION8
        </CardTitle>
        <CardDescription>
          {activeTab === 'login' ? 'Enter your secure access credentials.' : 'Choose your role and join the accelerator.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorHint && (
          <Alert className="mb-6 bg-accent/10 border-accent/20 text-accent">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs font-medium">{errorHint}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 mb-6">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full h-11 flex items-center justify-center gap-3 font-semibold border-2"
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <FormLabel>Access Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="h-11" disabled={isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-11 text-base font-bold bg-primary hover:bg-primary/90" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Verify & Enter"}
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 pt-6 outline-none">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3 mb-6">
                      <FormLabel>Register as:</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex gap-4"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 flex-1">
                            <FormControl>
                              <RadioGroupItem value="student" id="role-student" className="peer sr-only" />
                            </FormControl>
                            <Label
                              htmlFor="role-student"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-accent [&:has([data-state=checked])]:border-accent cursor-pointer w-full"
                            >
                              <User className="mb-2 h-6 w-6" />
                              <span className="font-bold text-xs uppercase">Student</span>
                            </Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 flex-1">
                            <FormControl>
                              <RadioGroupItem value="teacher" id="role-teacher" className="peer sr-only" />
                            </FormControl>
                            <Label
                              htmlFor="role-teacher"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-accent [&:has([data-state=checked])]:border-accent cursor-pointer w-full"
                            >
                              <GraduationCap className="mb-2 h-6 w-6" />
                              <span className="font-bold text-xs uppercase">Lecturer</span>
                            </Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                {form.watch('role') === 'teacher' && (
                  <p className="text-[10px] text-center text-muted-foreground mt-4 italic">
                    Lecturer accounts require admin vetting before curriculum access is granted.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
