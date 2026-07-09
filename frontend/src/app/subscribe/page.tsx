'use client';

import { PublicHeader } from '@/components/public-header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MonitorPlay, Sparkles, CheckCircle2, ShieldCheck, Zap, Globe } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const features = [
  "Full access to video course library",
  "AI-powered lesson summaries",
  "Downloadable project templates",
  "Community peer-help forum",
  "Verified digital certificates",
  "Early access to new ventures"
];

function SubscribeContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const returnTo = courseId ? `/courses/${courseId}` : '/courses';

  return (
    <div className="container mx-auto px-4 max-w-5xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 font-headline">Unlock Your Engineering Career</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Join the Digital Campus and master the skills needed to build the future of African innovation.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-stretch">
        {/* Online Path */}
        <Card className="flex flex-col border-2 border-accent shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-4 py-1 text-xs font-bold uppercase tracking-widest">
            Popular
          </div>
          <CardHeader className="text-center pb-8 border-b">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2 mb-2">
              <MonitorPlay className="text-accent h-6 w-6" /> Digital Campus
            </CardTitle>
            <CardDescription>Self-paced flexible learning</CardDescription>
            <div className="mt-6">
              <span className="text-5xl font-black">15,000</span>
              <span className="text-muted-foreground font-bold"> XAF / mo</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-8 space-y-4">
            <ul className="space-y-3">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="pb-8">
            <Button asChild size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-12">
              <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Start Your Subscription</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Onsite Path */}
        <Card className="flex flex-col border border-border bg-background/50">
          <CardHeader className="text-center pb-8 border-b">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2 mb-2">
              <Globe className="text-primary h-6 w-6" /> Onsite Accelerator
            </CardTitle>
            <CardDescription>Cohort-based intensive training</CardDescription>
            <div className="mt-6">
              <span className="text-muted-foreground font-bold italic">Application Required</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-8 space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Onsite Accelerator is a 12-week intensive engineering boot camp in our Bamenda labs. For those ready to commit 100% to building real hardware and complex software.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm font-medium">
                <ShieldCheck className="h-5 w-5 text-accent" /> Physical Lab Space
              </div>
              <div className="flex items-center gap-3 text-sm font-medium">
                <Zap className="h-5 w-5 text-accent" /> 1-on-1 Mentor Access
              </div>
              <div className="flex items-center gap-3 text-sm font-medium">
                <Sparkles className="h-5 w-5 text-accent" /> Hardware Starter Kits
              </div>
            </div>
          </CardContent>
          <CardFooter className="pb-8">
            <Button asChild variant="outline" size="lg" className="w-full border-primary text-primary hover:bg-primary/10 font-bold h-12">
              <Link href="/apply">Apply for Cohort 01</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-16 text-center text-sm text-muted-foreground">
        <p>Questions? Reach out to our admissions team at support@fusion8.com</p>
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <main className="flex-1 bg-secondary py-12 md:py-24">
        <Suspense fallback={null}>
          <SubscribeContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
