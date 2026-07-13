'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PublicHeader } from '@/components/public-header';
import { Footer } from '@/components/footer';
import {
  Check, Loader2, User, Briefcase, ChevronRight, ChevronLeft,
  BookOpen, MessageCircle, Cpu, Globe, Link2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitTeacherApplication } from '@/lib/application-actions';

const STEPS = [
  { label: 'Personal Info', icon: User },
  { label: 'Professional Background', icon: Briefcase },
  { label: 'Teaching Proposal', icon: BookOpen },
];

const EXPERTISE_OPTIONS = [
  'Robotics & Automation',
  'Arduino / Microcontrollers',
  'IoT & Connected Devices',
  'Embedded Systems',
  'Python Programming',
  'Electronics & Circuit Design',
  'AI & Machine Learning',
  'Mobile App Development',
  'Web Development',
  'CAD / 3D Printing',
  'Renewable Energy',
  'Data Science',
  'Cybersecurity',
  'Other',
];

const EXPERIENCE_YEARS = [
  'Less than 1 year',
  '1–2 years',
  '3–5 years',
  '6–10 years',
  'More than 10 years',
];

const HOURS_OPTIONS = [
  '2–4 hours / week',
  '5–8 hours / week',
  '9–15 hours / week',
  '16+ hours / week (full-time capacity)',
];

type FormData = {
  // Step 1
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  city: string;
  linkedIn: string;
  github: string;
  // Step 2
  yearsExperience: string;
  currentOccupation: string;
  employer: string;
  expertise: string[];
  hasTaughtBefore: string;
  teachingHistory: string;
  // Step 3
  proposedTopics: string;
  courseOutline: string;
  motivation: string;
  canWorkOnsite: string;
  hoursPerWeek: string;
  availableFrom: string;
  // Honeypot — visually hidden; a real visitor never fills this in.
  website: string;
};

const EMPTY: FormData = {
  fullName: '', email: '', phone: '', gender: '', city: '', linkedIn: '', github: '',
  yearsExperience: '', currentOccupation: '', employer: '', expertise: [], hasTaughtBefore: '', teachingHistory: '',
  proposedTopics: '', courseOutline: '', motivation: '', canWorkOnsite: '', hoursPerWeek: '', availableFrom: '',
  website: '',
};

export default function BecomeInstructorPage() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY);

  const set = (field: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const toggleExpertise = (area: string) => {
    setForm(prev => ({
      ...prev,
      expertise: prev.expertise.includes(area)
        ? prev.expertise.filter(e => e !== area)
        : [...prev.expertise, area],
    }));
  };

  const canAdvance = () => {
    if (step === 1) return !!(form.fullName && form.email && form.phone && form.gender && form.city);
    if (step === 2) return !!(form.yearsExperience && form.currentOccupation && form.expertise.length > 0 && form.hasTaughtBefore);
    if (step === 3) return !!(form.proposedTopics && form.motivation && form.canWorkOnsite && form.hoursPerWeek);
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await submitTeacherApplication(form);
      if (result.success) {
        setSubmitted(true);
      } else {
        toast({ variant: 'destructive', title: 'Submission failed', description: result.error ?? 'Please try again.' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Submission failed', description: 'Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-black font-headline tracking-tight mb-3">Application Received!</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              We've received your trainer application. Our team will review your profile and contact you at <strong className="text-foreground">{form.email}</strong> within 3–5 business days. If approved, you'll receive an invitation to register your account.
            </p>
            <div className="bg-accent/[0.06] border border-accent/15 rounded-xl p-4 text-left text-sm mb-6">
              <p className="font-bold text-accent mb-1">While you wait:</p>
              <p className="text-muted-foreground">Join our community WhatsApp group to connect with the Fusion8 team and other instructors.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button asChild variant="outline" className="border-2 rounded-xl font-bold h-11">
                <a href="https://chat.whatsapp.com/LflIGcSgE0AKgGlBmL01fD" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                  <MessageCircle className="h-4 w-4 text-[#25D366]" /> Join WhatsApp Community
                </a>
              </Button>
              <Button asChild variant="ghost" className="font-bold">
                <a href="/">Return Home</a>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-16 border-b border-black/[0.06] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(228,77,40,0.09) 0%, transparent 65%)' }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-8">
            <Cpu className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-accent">Become a Fusion8 Trainer</span>
          </div>
          <h1 className="text-display text-foreground mb-5 max-w-3xl mx-auto">
            Forge the Next Generation<br />of African Innovators.
          </h1>
          <p className="text-base md:text-lg max-w-xl mx-auto" style={{ color: 'rgba(100,116,139,0.85)' }}>
            Don't just share knowledge. Build a movement. At Fusion8 we're closing the skills gap in Cameroon — one hands-on engineer at a time.
          </p>
        </div>
      </section>

      {/* What trainers get */}
      <section className="bg-[#F3F4F6] border-b border-black/[0.06]">
        <div className="container mx-auto px-4 py-14">
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Globe, title: 'Platform Reach', desc: 'Your courses reach students across Cameroon and beyond through our LMS.' },
              { icon: BookOpen, title: 'Full Course Builder', desc: 'Upload your curriculum and videos with our Smart Course Wizard — no tech skills needed.' },
              { icon: Briefcase, title: 'Revenue Share', desc: 'Earn a percentage of every paid enrollment on your courses.' },
            ].map(b => (
              <div key={b.title} className="bg-card border border-black/[0.06] rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <b.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-black text-sm mb-1.5">{b.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The multi-step form */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">

            {/* Step indicator */}
            <div className="flex items-center gap-0 mb-8">
              {STEPS.map((s, i) => (
                <div key={s.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all ${i + 1 < step ? 'bg-accent border-accent text-white' : i + 1 === step ? 'border-accent text-accent bg-accent/10' : 'border-black/[0.12] text-muted-foreground bg-background'}`}>
                      {i + 1 < step ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className={`text-[10px] font-bold mt-1 hidden sm:block ${i + 1 === step ? 'text-accent' : 'text-muted-foreground'}`}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-[2px] mx-2 rounded-full transition-all" style={{ background: i + 1 < step ? '#E8461E' : 'rgba(100,116,139,0.15)' }} />
                  )}
                </div>
              ))}
            </div>

            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-secondary/30 border-b border-dashed">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                    {(() => { const Icon = STEPS[step - 1].icon; return <Icon className="h-4 w-4 text-accent" />; })()}
                  </div>
                  <div>
                    <CardTitle className="text-base">{STEPS[step - 1].label}</CardTitle>
                    <CardDescription>Step {step} of {STEPS.length}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* Honeypot — hidden from real visitors, catches simple bots */}
                <div className="sr-only" aria-hidden="true">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={e => set('website', e.target.value)} />
                </div>

                {/* STEP 1: Personal Info */}
                {step === 1 && (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="fullName">Full Name <span className="text-accent">*</span></Label>
                        <Input id="fullName" placeholder="e.g. Dr. Emmanuel Fonyam" value={form.fullName} onChange={e => set('fullName', e.target.value)} className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address <span className="text-accent">*</span></Label>
                        <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">WhatsApp Number <span className="text-accent">*</span></Label>
                        <Input id="phone" type="tel" placeholder="+237 6XX XXX XXX" value={form.phone} onChange={e => set('phone', e.target.value)} className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender <span className="text-accent">*</span></Label>
                        <select id="gender" value={form.gender} onChange={e => set('gender', e.target.value)}
                          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <option value="">Select gender</option>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Prefer not to say</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City / Location <span className="text-accent">*</span></Label>
                        <Input id="city" placeholder="e.g. Bamenda, Yaoundé, Douala" value={form.city} onChange={e => set('city', e.target.value)} className="h-11" />
                      </div>
                    </div>

                    <div className="border-t border-dashed pt-4 space-y-2">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Online Presence (optional)</p>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="linkedIn" className="flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5" /> LinkedIn URL</Label>
                          <Input id="linkedIn" placeholder="linkedin.com/in/yourname" value={form.linkedIn} onChange={e => set('linkedIn', e.target.value)} className="h-11 font-mono text-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="github" className="flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5" /> GitHub / Portfolio URL</Label>
                          <Input id="github" placeholder="github.com/yourname or portfolio link" value={form.github} onChange={e => set('github', e.target.value)} className="h-11 font-mono text-sm" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 2: Professional Background */}
                {step === 2 && (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="yearsExperience">Years of Professional Experience <span className="text-accent">*</span></Label>
                        <select id="yearsExperience" value={form.yearsExperience} onChange={e => set('yearsExperience', e.target.value)}
                          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <option value="">Select range</option>
                          {EXPERIENCE_YEARS.map(y => <option key={y}>{y}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currentOccupation">Current Occupation / Job Title <span className="text-accent">*</span></Label>
                        <Input id="currentOccupation" placeholder="e.g. Embedded Systems Engineer" value={form.currentOccupation} onChange={e => set('currentOccupation', e.target.value)} className="h-11" />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="employer">Employer / Organization (optional)</Label>
                        <Input id="employer" placeholder="e.g. Camtel, University of Bamenda, Freelance" value={form.employer} onChange={e => set('employer', e.target.value)} className="h-11" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Areas of Expertise <span className="text-accent">*</span></Label>
                      <p className="text-xs text-muted-foreground">Select all that apply. These will determine which courses you can teach.</p>
                      <div className="grid grid-cols-2 gap-2">
                        {EXPERTISE_OPTIONS.map(area => (
                          <label key={area} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all text-sm ${form.expertise.includes(area) ? 'border-accent bg-accent/[0.06] text-accent font-semibold' : 'border-black/[0.08] hover:border-accent/30'}`}>
                            <input
                              type="checkbox"
                              checked={form.expertise.includes(area)}
                              onChange={() => toggleExpertise(area)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all ${form.expertise.includes(area) ? 'bg-accent border-accent' : 'border-black/20'}`}>
                              {form.expertise.includes(area) && <Check className="h-2.5 w-2.5 text-white" />}
                            </div>
                            {area}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 border-t border-dashed pt-4">
                      <div className="space-y-2">
                        <Label>Have you taught or trained people before? <span className="text-accent">*</span></Label>
                        <div className="flex gap-3">
                          {['Yes', 'No'].map(opt => (
                            <label key={opt} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer font-semibold text-sm transition-all ${form.hasTaughtBefore === opt ? 'border-accent bg-accent/[0.06] text-accent' : 'border-black/[0.08] hover:border-accent/30'}`}>
                              <input type="radio" name="hasTaughtBefore" value={opt} checked={form.hasTaughtBefore === opt} onChange={() => set('hasTaughtBefore', opt)} className="sr-only" />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                      {form.hasTaughtBefore === 'Yes' && (
                        <div className="space-y-2">
                          <Label htmlFor="teachingHistory">Describe your teaching or training experience</Label>
                          <Textarea id="teachingHistory" rows={3} placeholder="e.g. I ran weekend Arduino workshops at HTTTC Bambili for 2 years, training 30+ students per cohort." value={form.teachingHistory} onChange={e => set('teachingHistory', e.target.value)} className="resize-none" />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* STEP 3: Teaching Proposal */}
                {step === 3 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="proposedTopics">What topics or courses do you want to build on Fusion8? <span className="text-accent">*</span></Label>
                      <p className="text-xs text-muted-foreground">Be specific. Name the course(s) you have in mind and the target skill level.</p>
                      <Textarea id="proposedTopics" rows={3} placeholder={"e.g.\n1. Intro to Arduino for Beginners (8 lessons, beginner)\n2. ESP32 IoT with Firebase (10 lessons, intermediate)\n3. Building a Line-Following Robot (6 lessons, beginner)"} value={form.proposedTopics} onChange={e => set('proposedTopics', e.target.value)} className="resize-none" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="courseOutline">Briefly outline your first course (optional)</Label>
                      <p className="text-xs text-muted-foreground">Module names, topics covered, estimated video length, practical projects included.</p>
                      <Textarea id="courseOutline" rows={4} placeholder={"e.g. Module 1: What is Arduino? (20 min video + quiz)\nModule 2: Blink LED (15 min + hands-on)\nModule 3: Buttons and Inputs..."} value={form.courseOutline} onChange={e => set('courseOutline', e.target.value)} className="resize-none" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="motivation">Why do you want to teach at Fusion8? <span className="text-accent">*</span></Label>
                      <p className="text-xs text-muted-foreground">Tell us what drives you. What impact do you want to have in Cameroon's tech ecosystem?</p>
                      <Textarea id="motivation" rows={4} placeholder="e.g. I grew up in Bamenda and had no access to practical tech training. I had to teach myself everything on YouTube. Fusion8 is the lab I wished existed when I was 18 — I want to be the trainer that students like me needed." value={form.motivation} onChange={e => set('motivation', e.target.value)} className="resize-none" />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 border-t border-dashed pt-4">
                      <div className="space-y-2">
                        <Label>Can you teach onsite in Bamenda? <span className="text-accent">*</span></Label>
                        <div className="flex flex-col gap-2">
                          {["Yes, I'm based in Bamenda", 'Yes, I can travel periodically', 'Online only'].map(opt => (
                            <label key={opt} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer text-sm transition-all ${form.canWorkOnsite === opt ? 'border-accent bg-accent/[0.06] text-accent font-semibold' : 'border-black/[0.08] hover:border-accent/30'}`}>
                              <input type="radio" name="canWorkOnsite" value={opt} checked={form.canWorkOnsite === opt} onChange={() => set('canWorkOnsite', opt)} className="sr-only" />
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${form.canWorkOnsite === opt ? 'border-accent' : 'border-black/20'}`}>
                                {form.canWorkOnsite === opt && <div className="w-2 h-2 rounded-full bg-accent" />}
                              </div>
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="hoursPerWeek">Availability per week <span className="text-accent">*</span></Label>
                          <select id="hoursPerWeek" value={form.hoursPerWeek} onChange={e => set('hoursPerWeek', e.target.value)}
                            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <option value="">Select range</option>
                            {HOURS_OPTIONS.map(h => <option key={h}>{h}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="availableFrom">Earliest start date (optional)</Label>
                          <Input id="availableFrom" type="date" value={form.availableFrom} onChange={e => set('availableFrom', e.target.value)} className="h-11" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Navigation */}
                <div className="flex gap-3 pt-2 border-t border-dashed">
                  {step > 1 && (
                    <Button variant="outline" onClick={() => setStep(s => s - 1)} className="border-2 rounded-xl font-bold h-11 px-5">
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                  )}
                  {step < 3 ? (
                    <Button
                      onClick={() => setStep(s => s + 1)}
                      disabled={!canAdvance()}
                      className="flex-1 bg-accent hover:bg-orange-600 text-white font-bold h-11 rounded-xl shadow-md shadow-accent/20"
                    >
                      Next Step <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!canAdvance() || isSubmitting}
                      className="flex-1 bg-accent hover:bg-orange-600 text-white font-bold h-11 rounded-xl shadow-md shadow-accent/20"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                      Submit Application
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
