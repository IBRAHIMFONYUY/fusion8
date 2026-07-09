'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Rocket, Loader2, CheckCircle, ArrowLeft, Mail } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [isPending, setIsPending] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);
    try {
      await sendPasswordResetEmail(auth, values.email.trim().toLowerCase());
      setSentTo(values.email.trim().toLowerCase());
      setSent(true);
    } catch (error: any) {
      // We show success even for unknown emails to prevent user enumeration
      setSentTo(values.email.trim().toLowerCase());
      setSent(true);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center bg-secondary py-12 px-4">
        <Card className="w-full max-w-sm sm:max-w-md shadow-2xl border-none">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl flex items-center justify-center gap-2 font-headline font-black">
              <Rocket className="text-accent h-8 w-8" /> FUSION8
            </CardTitle>
            <CardDescription>
              {sent ? 'Check your inbox' : 'Reset your access password'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {sent ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-base">Reset link sent</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    If an account exists for <span className="font-semibold text-foreground">{sentTo}</span>, a
                    password reset link has been sent. Check your spam folder if you don't see it.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-2 font-bold border-2 rounded-xl"
                  onClick={() => { setSent(false); form.reset(); }}
                >
                  Send to a different email
                </Button>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-accent transition-colors flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" /> Back to login
                </Link>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="name@fusion8.com"
                              {...field}
                              className="h-11 pl-9"
                              disabled={isPending}
                              autoComplete="email"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-11 font-bold bg-primary hover:bg-primary/90"
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Send Reset Link'}
                  </Button>
                  <div className="text-center">
                    <Link
                      href="/login"
                      className="text-sm text-muted-foreground hover:text-accent transition-colors flex items-center justify-center gap-1"
                    >
                      <ArrowLeft className="h-3 w-3" /> Back to login
                    </Link>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
