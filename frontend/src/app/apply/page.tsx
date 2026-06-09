'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { IMAGES } from '@/lib/images';
import Image from 'next/image';
import { Check, MessageCircle, ExternalLink, MapPin, Phone, Mail } from 'lucide-react';

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

const STEPS = [
  { n: '01', t: 'Fill the Form', d: 'Complete the Google Form with your info and motivation.' },
  { n: '02', t: 'Send Payment', d: 'Send 5,000 XAF via MTN MoMo to 680 149 883 (Jones Yondo). Use your name as reference.' },
  { n: '03', t: 'Get Confirmation', d: 'We confirm your spot via WhatsApp within 24–48 hours.' },
  { n: '04', t: 'Join the Group', d: 'Join the cohort WhatsApp group and receive your starter kit info.' },
];

export default function ApplyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

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

      {/* How to apply — 4 steps */}
      <section className="bg-[#F3F4F6] border-b border-black/[0.06]">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">How to Apply</p>
            <h2 className="text-section text-foreground">Four Steps. Ten Minutes.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.n} className={`relative bg-card border rounded-2xl p-6 hover:border-accent/25 transition-all ${i === 0 ? 'border-accent/25 bg-accent/[0.04]' : 'border-black/[0.06]'}`}>
                <div className="text-5xl font-black font-mono mb-3 leading-none" style={{ color: i === 0 ? 'rgba(228,77,40,0.35)' : 'rgba(100,116,139,0.15)' }}>{s.n}</div>
                <h3 className={`text-sm font-black mb-1.5 ${i === 0 ? 'text-accent' : 'text-foreground'}`}>{s.t}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(100,116,139,0.80)' }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main content: form + payment */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">

            {/* Left: Form + WhatsApp */}
            <div className="space-y-5">
              {/* Registration form */}
              <div className="bg-card border border-accent/20 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-black/[0.06]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Step 01</p>
                  <h3 className="text-lg font-black text-foreground">Complete the Application Form</h3>
                  <p className="text-sm mt-1" style={{ color: 'rgba(100,116,139,0.80)' }}>Takes about 5 minutes. Tell us who you are and why you want to build.</p>
                </div>
                <div className="p-6">
                  <Button asChild size="lg" className="w-full bg-accent hover:bg-orange-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-accent/20 transition-all hover:shadow-xl">
                    <a href="https://forms.gle/gJrPn9GxPEctccVo9" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      Open Application Form <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="bg-card border border-black/[0.06] hover:border-accent/15 rounded-2xl overflow-hidden transition-all">
                <div className="p-6 border-b border-black/[0.06]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Step 04</p>
                  <h3 className="text-lg font-black text-foreground">Join the Community</h3>
                  <p className="text-sm mt-1" style={{ color: 'rgba(100,116,139,0.80)' }}>After payment confirmation, join the cohort WhatsApp group.</p>
                </div>
                <div className="p-6">
                  <Button asChild size="lg" variant="outline" className="w-full border-black/[0.10] text-foreground hover:bg-black/[0.03] h-12 rounded-xl font-semibold">
                    <a href="https://chat.whatsapp.com/LflIGcSgE0AKgGlBmL01fD" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      <MessageCircle className="h-4 w-4 text-[#25D366]" /> Join WhatsApp Group
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Payment instructions */}
            <div className="space-y-5">
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
                      <span className="font-black text-accent">Important:</span> After payment, screenshot your MoMo confirmation and send it to us on WhatsApp at <span className="font-mono font-bold">+237 680 149 883</span> with your full name.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-card border border-black/[0.06] rounded-2xl p-6">
                <p className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: 'rgba(100,116,139,0.55)' }}>Questions? Contact Us</p>
                <div className="space-y-3">
                  <a href="tel:+237680149883" className="flex items-center gap-3 text-sm hover:text-white transition-colors" style={{ color: 'rgba(100,116,139,0.85)' }}>
                    <Phone className="h-4 w-4 text-accent shrink-0" />+237 680 149 883
                  </a>
                  <a href="mailto:fusion8.cohort01@gmail.com" className="flex items-center gap-3 text-sm hover:text-white transition-colors" style={{ color: 'rgba(100,116,139,0.85)' }}>
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

      {/* Requirements + what's included */}
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

      {/* Final urgency */}
      <section className="bg-accent relative overflow-hidden">
        <div className="absolute inset-0 grid-texture opacity-[0.06]" />
        <div className="container mx-auto px-4 py-16 text-center relative z-10">
          <h2 className="font-black text-white mb-3 leading-tight" style={{ fontSize: 'clamp(1.6rem,4.5vw,3rem)', letterSpacing: '-0.03em' }}>
            30 Spots. First Come, First Served.
          </h2>
          <p className="text-white/70 mb-7">Don't wait. The list fills fast and we don't reopen once it's closed.</p>
          <Button asChild size="lg" className="bg-[#0A0E10] hover:bg-black text-white font-bold h-12 px-7 rounded-xl shadow-2xl shadow-black/40 transition-all">
            <a href="https://forms.gle/gJrPn9GxPEctccVo9" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              Apply Now <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
