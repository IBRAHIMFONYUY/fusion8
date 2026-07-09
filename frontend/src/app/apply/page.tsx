'use client';

import { useState } from 'react';
import { PublicHeader } from '@/components/public-header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IMAGES } from '@/lib/images';
import Image from 'next/image';
import {
  Check, MessageCircle, MapPin, Phone, Mail, ChevronRight,
  ChevronLeft, Loader2, User, GraduationCap, Heart, Zap,
} from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore, useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

const STEPS = [
  { n: '01', t: 'Your Details', icon: User },
  { n: '02', t: 'Background', icon: GraduationCap },
  { n: '03', t: 'Motivation', icon: Heart },
  { n: '04', t: 'Commitment', icon: Zap },
];

const EDUCATION_OPTIONS = [
  'Secondary School (O/A Level)',
  'University Student',
  'Bachelor\'s Degree',
  'Master\'s Degree or higher',
  'Vocational / Technical Training',
  'Self-taught',
  'Other',
];

const OCCUPATION_OPTIONS = [
  'Student',
  'Employed (full-time)',
  'Employed (part-time)',
  'Self-employed / Entrepreneur',
  'Unemployed / Job seeking',
  'Other',
];

const HOW_HEARD_OPTIONS = [
  'Facebook / Instagram',
  'WhatsApp group',
  'Friend or family member',
  'University / School notice board',
  'YouTube',
  'Twitter / X',
  'Online search',
  'Saw it in person / event',
  'Other',
];

const REQUIREMENTS = [
  'Curiosity and hunger to build — no experience required',
  'Basic literacy in science, maths, or technology',
  'Commitment to 2 sessions/week for 7 weeks',
  'Ability to pay 5,000 XAF program fee before start date',
  'Access to a smartphone or laptop for notes',
];

const INCLUDED = [
  'All hardware components and Arduino kits',
  'Lab access throughout the 7-week program',
  'Hands-on project materials',
  'Certificate of Completion',
  'Alumni network access',
  'Priority pathway to Incubator',
];

type FormData = {
  // Step 1 — Personal
  fullName: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  location: string;
  educationLevel: string;
  occupation: string;
  // Step 2 — Background
  currentSkills: string;
  previousHardware: string;
  howHeard: string;
  // Step 3 — Motivation
  projectIdea: string;
  expectations: string;
  biggestChallenge: string;
  // Step 4 — Commitment
  hasDevice: boolean;
  canCommit: boolean;
  emergencyName: string;
  emergencyPhone: string;
  paymentRef: string;
};

const EMPTY: FormData = {
  fullName: '', email: '', phone: '', age: '', gender: '', location: '',
  educationLevel: '', occupation: '',
  currentSkills: '', previousHardware: '', howHeard: '',
  projectIdea: '', expectations: '', biggestChallenge: '',
  hasDevice: false, canCommit: false, emergencyName: '', emergencyPhone: '', paymentRef: '',
};

export default function ApplyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1-4 = form steps, 5 = success
  const [form, setForm] = useState<FormData>(EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const canAdvance = () => {
    if (step === 1) return !!(form.fullName && form.email && form.phone && form.age && form.gender && form.location && form.educationLevel && form.occupation);
    if (step === 2) return !!(form.currentSkills && form.howHeard);
    if (step === 3) return !!(form.projectIdea && form.expectations);
    if (step === 4) return !!(form.hasDevice && form.canCommit && form.emergencyName && form.emergencyPhone);
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'cohort_applications'), {
        // Personal
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        age: form.age,
        gender: form.gender,
        location: form.location.trim(),
        educationLevel: form.educationLevel,
        occupation: form.occupation,
        ageLocation: `${form.age} yrs — ${form.location}`,
        // Background
        currentSkills: form.currentSkills.trim(),
        previousHardware: form.previousHardware.trim(),
        howHeard: form.howHeard,
        // Motivation
        projectIdea: form.projectIdea.trim(),
        expectations: form.expectations.trim(),
        biggestChallenge: form.biggestChallenge.trim(),
        // Commitment
        hasDevice: form.hasDevice,
        canCommit: form.canCommit,
        emergencyName: form.emergencyName.trim(),
        emergencyPhone: form.emergencyPhone.trim(),
        paymentRef: form.paymentRef.trim(),
        // Meta
        studentId: user?.uid ?? null,
        status: 'pending',
        appliedAt: serverTimestamp(),
      });
      setStep(5);
    } catch {
      toast({ variant: 'destructive', title: 'Submission failed', description: 'Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-20 border-b border-black/[0.06] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Image src={IMAGES.graduationDay} alt="" fill className="object-cover opacity-[0.09]" />
          <div className="absolute inset-0 bg-background/93" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(228,77,40,0.09) 0%, transparent 65%)' }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-accent">Now Enrolling — Only 30 Spots</span>
          </div>
          <h1 className="text-display text-foreground mb-6 max-w-3xl mx-auto">Secure Your Spot in Cohort 01.</h1>
          <p className="text-base md:text-lg max-w-xl mx-auto mb-4" style={{ color: 'rgba(100,116,139,0.85)' }}>
            Hardware &amp; IoT Bootcamp · 7 Weeks · Bamenda, Cameroon · 5,000 XAF
          </p>
        </div>
      </section>

      {/* Process steps */}
      <section className="bg-[#F3F4F6] border-b border-black/[0.06]">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">How to Apply</p>
            <h2 className="text-section text-foreground">Four Steps. Ten Minutes.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { n: '01', t: 'Fill This Form', d: 'Complete our application below. Takes about 5 minutes.' },
              { n: '02', t: 'Send Payment', d: 'Send 5,000 XAF via MTN MoMo to 680 149 883 (Jones Yondo).' },
              { n: '03', t: 'Get Confirmation', d: 'We confirm your spot via WhatsApp within 24–48 hours.' },
              { n: '04', t: 'Join the Group', d: 'Join the cohort WhatsApp group and receive your starter kit info.' },
            ].map((s, i) => (
              <div key={s.n} className={`relative bg-card border rounded-2xl p-6 hover:border-accent/25 transition-all ${i === 0 ? 'border-accent/25 bg-accent/[0.04]' : 'border-black/[0.06]'}`}>
                <div className="text-5xl font-black font-mono mb-3 leading-none" style={{ color: i === 0 ? 'rgba(228,77,40,0.35)' : 'rgba(100,116,139,0.15)' }}>{s.n}</div>
                <h3 className={`text-sm font-black mb-1.5 ${i === 0 ? 'text-accent' : 'text-foreground'}`}>{s.t}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(100,116,139,0.80)' }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main: Form + Payment side by side */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-[1fr_380px] gap-10 max-w-5xl mx-auto">

            {/* ── APPLICATION FORM ── */}
            <div>
              {step < 5 ? (
                <div className="bg-card border border-black/[0.06] rounded-3xl overflow-hidden shadow-xl">
                  {/* Progress header */}
                  <div className="bg-secondary/30 border-b border-dashed p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Application Form</p>
                        <h3 className="text-lg font-black text-foreground">{STEPS[step - 1].t}</h3>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">{step} of 4</span>
                    </div>
                    {/* Progress bar */}
                    <div className="flex gap-1.5">
                      {STEPS.map((_, i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i < step ? '#E8461E' : 'rgba(100,116,139,0.15)' }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* STEP 1: Personal Details */}
                    {step === 1 && (
                      <>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="fullName">Full Name <span className="text-accent">*</span></Label>
                            <Input id="fullName" placeholder="e.g. Marie-Claire Nkeng" value={form.fullName} onChange={e => set('fullName', e.target.value)} className="h-11" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address <span className="text-accent">*</span></Label>
                            <Input id="email" type="email" placeholder="you@gmail.com" value={form.email} onChange={e => set('email', e.target.value)} className="h-11" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">WhatsApp Number <span className="text-accent">*</span></Label>
                            <Input id="phone" type="tel" placeholder="+237 6XX XXX XXX" value={form.phone} onChange={e => set('phone', e.target.value)} className="h-11" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="age">Age <span className="text-accent">*</span></Label>
                            <Input id="age" type="number" min="14" max="60" placeholder="e.g. 22" value={form.age} onChange={e => set('age', e.target.value)} className="h-11" />
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
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="location">City / Neighbourhood <span className="text-accent">*</span></Label>
                            <Input id="location" placeholder="e.g. Bamenda — Nkwen" value={form.location} onChange={e => set('location', e.target.value)} className="h-11" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="educationLevel">Education Level <span className="text-accent">*</span></Label>
                            <select id="educationLevel" value={form.educationLevel} onChange={e => set('educationLevel', e.target.value)}
                              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                              <option value="">Select level</option>
                              {EDUCATION_OPTIONS.map(o => <option key={o}>{o}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="occupation">Current Occupation <span className="text-accent">*</span></Label>
                            <select id="occupation" value={form.occupation} onChange={e => set('occupation', e.target.value)}
                              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                              <option value="">Select occupation</option>
                              {OCCUPATION_OPTIONS.map(o => <option key={o}>{o}</option>)}
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    {/* STEP 2: Background */}
                    {step === 2 && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="currentSkills">What are your current skills or technical knowledge? <span className="text-accent">*</span></Label>
                          <p className="text-xs text-muted-foreground">Include anything — coding basics, fixing electronics, using tools, DIY projects, etc. If none, say so.</p>
                          <Textarea id="currentSkills" rows={3} placeholder="e.g. I know basic Python from online tutorials. I've repaired phone screens before but never built a circuit." value={form.currentSkills} onChange={e => set('currentSkills', e.target.value)} className="resize-none" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="previousHardware">Have you worked with any hardware before? (optional)</Label>
                          <p className="text-xs text-muted-foreground">Arduino, Raspberry Pi, sensors, motors, robotics kits, electrical wiring, etc.</p>
                          <Textarea id="previousHardware" rows={3} placeholder="e.g. I assembled a basic LED circuit kit in secondary school. That's it." value={form.previousHardware} onChange={e => set('previousHardware', e.target.value)} className="resize-none" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="howHeard">How did you hear about Fusion8? <span className="text-accent">*</span></Label>
                          <select id="howHeard" value={form.howHeard} onChange={e => set('howHeard', e.target.value)}
                            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <option value="">Select one</option>
                            {HOW_HEARD_OPTIONS.map(o => <option key={o}>{o}</option>)}
                          </select>
                        </div>
                      </>
                    )}

                    {/* STEP 3: Motivation */}
                    {step === 3 && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="projectIdea">What project or device do you want to build in 7 weeks? <span className="text-accent">*</span></Label>
                          <p className="text-xs text-muted-foreground">Be specific. We want to understand what problem you're trying to solve. No idea is too small.</p>
                          <Textarea id="projectIdea" rows={4} placeholder="e.g. I want to build a soil moisture sensor that sends alerts to my phone when our farm needs watering. My family farms and we often lose crops from overwatering." value={form.projectIdea} onChange={e => set('projectIdea', e.target.value)} className="resize-none" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expectations">What do you expect to gain from this program? <span className="text-accent">*</span></Label>
                          <p className="text-xs text-muted-foreground">Skills, career goals, specific outcomes — be honest.</p>
                          <Textarea id="expectations" rows={3} placeholder="e.g. I want to get hands-on with electronics so I can start freelancing in tech. I also want to build my portfolio before applying for engineering school." value={form.expectations} onChange={e => set('expectations', e.target.value)} className="resize-none" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="biggestChallenge">What do you think will be your biggest challenge in this program? (optional)</Label>
                          <Textarea id="biggestChallenge" rows={2} placeholder="e.g. Time management — I work part-time but I'm committed to making it work." value={form.biggestChallenge} onChange={e => set('biggestChallenge', e.target.value)} className="resize-none" />
                        </div>
                      </>
                    )}

                    {/* STEP 4: Commitment */}
                    {step === 4 && (
                      <>
                        <div className="space-y-4">
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={form.hasDevice}
                              onChange={e => set('hasDevice', e.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-accent accent-[#E8461E]"
                            />
                            <span className="text-sm leading-relaxed">
                              <span className="font-bold">I have access to a smartphone or laptop</span> to take notes and follow along during sessions. <span className="text-accent font-bold">*</span>
                            </span>
                          </label>
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={form.canCommit}
                              onChange={e => set('canCommit', e.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-gray-300 accent-[#E8461E]"
                            />
                            <span className="text-sm leading-relaxed">
                              <span className="font-bold">I commit to attending 2 sessions per week for the full 7-week duration</span> of the cohort. I understand that missing more than 2 sessions may result in losing my spot. <span className="text-accent font-bold">*</span>
                            </span>
                          </label>
                        </div>

                        <div className="border-t border-dashed pt-5 space-y-4">
                          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Emergency Contact</p>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="emergencyName">Contact Full Name <span className="text-accent">*</span></Label>
                              <Input id="emergencyName" placeholder="e.g. Ambroise Nkeng" value={form.emergencyName} onChange={e => set('emergencyName', e.target.value)} className="h-11" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="emergencyPhone">Contact Phone Number <span className="text-accent">*</span></Label>
                              <Input id="emergencyPhone" type="tel" placeholder="+237 6XX XXX XXX" value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} className="h-11" />
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-dashed pt-5 space-y-2">
                          <Label htmlFor="paymentRef">MTN MoMo Payment Reference (optional)</Label>
                          <p className="text-xs text-muted-foreground">If you've already sent the 5,000 XAF payment, paste your MoMo transaction ID here to speed up confirmation.</p>
                          <Input id="paymentRef" placeholder="e.g. 2401839201 or your full name used as reference" value={form.paymentRef} onChange={e => set('paymentRef', e.target.value)} className="h-11 font-mono" />
                        </div>
                      </>
                    )}

                    {/* Navigation */}
                    <div className="flex gap-3 pt-2">
                      {step > 1 && (
                        <Button variant="outline" onClick={() => setStep(s => s - 1)} className="border-2 rounded-xl font-bold h-11 px-5">
                          <ChevronLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                      )}
                      {step < 4 ? (
                        <Button
                          onClick={() => setStep(s => s + 1)}
                          disabled={!canAdvance()}
                          className="flex-1 bg-accent hover:bg-orange-600 text-white font-bold h-11 rounded-xl shadow-md shadow-accent/20"
                        >
                          Next <ChevronRight className="h-4 w-4 ml-1" />
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
                  </div>
                </div>
              ) : (
                /* SUCCESS STATE */
                <div className="bg-card border border-green-200 rounded-3xl p-10 text-center shadow-xl">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-black mb-2">Application Received!</h2>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                    Your application is in the queue. We'll contact you on WhatsApp at <span className="font-bold text-foreground">{form.phone}</span> within 24–48 hours to confirm your spot.
                  </p>
                  <div className="bg-accent/[0.06] border border-accent/15 rounded-xl p-4 text-left text-sm mb-6">
                    <p className="font-bold text-accent mb-1">Next step:</p>
                    <p className="text-muted-foreground">If you haven't yet, send <strong className="text-foreground">5,000 XAF via MTN MoMo</strong> to <strong className="text-foreground">680 149 883</strong> (Jones Yondo). Use your name as the reference. Then WhatsApp us the screenshot at the same number.</p>
                  </div>
                  <Button asChild variant="outline" className="border-2 rounded-xl font-bold">
                    <a href="https://chat.whatsapp.com/LflIGcSgE0AKgGlBmL01fD" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-[#25D366]" /> Join Cohort WhatsApp Group
                    </a>
                  </Button>
                </div>
              )}
            </div>

            {/* ── SIDEBAR: Payment + Contact ── */}
            <div className="space-y-5">
              {/* Payment */}
              <div className="bg-card border border-black/[0.06] rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-black/[0.06]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Step 02</p>
                  <h3 className="text-lg font-black text-foreground">Send Payment</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-background border border-accent/15 rounded-xl p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(100,116,139,0.60)' }}>MTN Mobile Money</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: 'rgba(100,116,139,0.85)' }}>Number</span>
                        <span className="text-base font-black font-mono text-foreground">680 149 883</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: 'rgba(100,116,139,0.85)' }}>Name</span>
                        <span className="text-sm font-bold text-foreground">Jones Yondo</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: 'rgba(100,116,139,0.85)' }}>Amount</span>
                        <span className="text-2xl font-black text-accent">5,000 XAF</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: 'rgba(100,116,139,0.85)' }}>Reference</span>
                        <span className="text-xs font-bold text-foreground">Your full name + F8-2026</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-accent/[0.06] border border-accent/15 rounded-xl p-4">
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(51,65,85,0.75)' }}>
                      <span className="font-black text-accent">Important:</span> After payment, WhatsApp us the MoMo screenshot at <span className="font-mono font-bold">+237 680 149 883</span> with your full name.
                    </p>
                  </div>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="bg-card border border-black/[0.06] rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-black/[0.06]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Step 04</p>
                  <h3 className="text-lg font-black text-foreground">Join the Community</h3>
                  <p className="text-sm mt-1" style={{ color: 'rgba(100,116,139,0.80)' }}>After confirmation, join the cohort WhatsApp group.</p>
                </div>
                <div className="p-6">
                  <Button asChild size="lg" variant="outline" className="w-full border-black/[0.10] h-12 rounded-xl font-semibold">
                    <a href="https://chat.whatsapp.com/LflIGcSgE0AKgGlBmL01fD" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      <MessageCircle className="h-4 w-4 text-[#25D366]" /> Join WhatsApp Group
                    </a>
                  </Button>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-card border border-black/[0.06] rounded-2xl p-6">
                <p className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: 'rgba(100,116,139,0.55)' }}>Questions? Contact Us</p>
                <div className="space-y-3">
                  <a href="tel:+237680149883" className="flex items-center gap-3 text-sm hover:text-accent transition-colors" style={{ color: 'rgba(100,116,139,0.85)' }}>
                    <Phone className="h-4 w-4 text-accent shrink-0" />+237 680 149 883
                  </a>
                  <a href="mailto:fusion8.cohort01@gmail.com" className="flex items-center gap-3 text-sm hover:text-accent transition-colors" style={{ color: 'rgba(100,116,139,0.85)' }}>
                    <Mail className="h-4 w-4 text-accent shrink-0" />fusion8.cohort01@gmail.com
                  </a>
                  <div className="flex items-center gap-3 text-sm" style={{ color: 'rgba(100,116,139,0.85)' }}>
                    <MapPin className="h-4 w-4 text-accent shrink-0" />Bamenda, Northwest Region, Cameroon
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements + Included */}
      <section className="bg-[#F3F4F6] border-y border-black/[0.06]">
        <div className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-6">Requirements</p>
              <ul className="space-y-3">
                {REQUIREMENTS.map(r => (
                  <li key={r} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(51,65,85,0.80)' }}>
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />{r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-6">What's Included (5,000 XAF)</p>
              <ul className="space-y-3">
                {INCLUDED.map(r => (
                  <li key={r} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(51,65,85,0.80)' }}>
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />{r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-accent relative overflow-hidden">
        <div className="absolute inset-0 grid-texture opacity-[0.06]" />
        <div className="container mx-auto px-4 py-16 text-center relative z-10">
          <h2 className="font-black text-white mb-3 leading-tight" style={{ fontSize: 'clamp(1.6rem,4.5vw,3rem)', letterSpacing: '-0.03em' }}>
            30 Spots. First Come, First Served.
          </h2>
          <p className="text-white/70 mb-7">Don't wait. The list fills fast and we don't reopen once it's closed.</p>
          <Button
            onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); if (step === 5) setStep(1); }}
            size="lg"
            className="bg-[#0A0E10] hover:bg-black text-white font-bold h-12 px-7 rounded-xl shadow-2xl shadow-black/40 transition-all"
          >
            Apply Now
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
