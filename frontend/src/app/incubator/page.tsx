'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { IMAGES } from '@/lib/images';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, BarChart3, Beaker, TrendingUp, DollarSign, Users } from 'lucide-react';

const DIMENSIONS = [
  {
    title: 'Research Score',
    desc: 'Problem clearly defined? Market size estimated? Competitive landscape mapped? User interviews done?',
    icon: BarChart3,
  },
  {
    title: 'Prototype Score',
    desc: 'Does a physical or digital prototype exist? Is it reproducible? Has it been tested with real users?',
    icon: Beaker,
  },
  {
    title: 'Market Score',
    desc: 'Is there evidence of demand? Is the target customer defined? Is there a go-to-market strategy?',
    icon: TrendingUp,
  },
  {
    title: 'Business Score',
    desc: 'Is there a revenue model? Are unit economics calculated? Is there a capable team and a 12-month plan?',
    icon: DollarSign,
  },
  {
    title: 'Investment Score',
    desc: 'Is there a financial model? A pitch deck? Is the IP protected? Is the team ready to pitch investors?',
    icon: Users,
  },
];

const GRADES = [
  { grade: 'A+', range: '90–100', label: 'Investment Ready', desc: 'Proceed to Investor Day', color: 'text-accent border-accent/40 bg-accent/10' },
  { grade: 'A',  range: '75–89',  label: 'Acceleration Ready', desc: 'Enter Product Accelerator', color: 'text-accent/80 border-accent/25 bg-accent/[0.06]' },
  { grade: 'B',  range: '55–74',  label: 'Incubation Ready', desc: 'Enter Innovation Incubator', color: 'text-foreground border-white/20 bg-card' },
  { grade: 'C',  range: '35–54',  label: 'Prototype Stage', desc: 'Re-enter Academy for skills gap', color: 'text-foreground/60 border-white/10 bg-card/50' },
  { grade: 'D',  range: '0–34',   label: 'Idea Stage', desc: 'Needs fundamental development', color: 'text-foreground/35 border-white/[0.06] bg-transparent' },
];

const WHAT_YOU_GET = [
  'Dedicated mentor (engineer + business expert)',
  'Access to Fusion 8 Engineering Labs',
  'Weekly structured progress reviews',
  'Market research tools and frameworks',
  'Business development guidance and coaching',
  'Legal and IP documentation support',
  'Connection to investor network',
  'Demo Day 2.0 — Investor Day presentation slot',
];

const STAGES = [
  { n: '01', t: 'Discovery', d: 'Problem validation, market sizing, competitive analysis' },
  { n: '02', t: 'Ideation', d: 'Solution design, technical feasibility assessment' },
  { n: '03', t: 'Prototype', d: 'First physical or digital prototype built and tested' },
  { n: '04', t: 'Validation', d: 'Real user testing, feedback integration, pivot or proceed' },
  { n: '05', t: 'MVP', d: 'Minimum viable product — core functionality working end-to-end' },
  { n: '06', t: 'Graduation', d: 'Innovation Readiness Score A or A+ — ready for Acceleration' },
];

export default function IncubatorPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-20 border-b border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Image src={IMAGES.prototypeDesk} alt="" fill className="object-cover opacity-[0.07]" />
          <div className="absolute inset-0 bg-background/93" />
          <div className="absolute top-1/2 right-1/3 w-[500px] h-[400px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(228,77,40,0.07) 0%, transparent 65%)' }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-5">Innovation Incubator</p>
          <h1 className="text-display text-foreground mb-6 max-w-3xl mx-auto">Every Great Product Starts Somewhere.</h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto mb-10" style={{ color: 'rgba(246,245,242,0.55)' }}>
            The Fusion 8 Incubator takes your early-stage idea from raw concept
            to validated MVP — with mentorship, lab access, and structured support at every step.
          </p>
          <div className="inline-flex items-center gap-2 border border-white/15 rounded-full px-5 py-2 text-sm font-semibold" style={{ color: 'rgba(246,245,242,0.50)' }}>
            Open to Academy graduates · Applications reviewed quarterly
          </div>
        </div>
      </section>

      {/* Incubation stages */}
      <section className="bg-[#070A0C] border-b border-white/[0.06]">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">The Process</p>
            <h2 className="text-section text-foreground">Six Stages. One Outcome: A Product.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {STAGES.map((s, i) => (
              <div key={s.n} className="bg-card border border-white/[0.07] hover:border-accent/25 rounded-2xl p-6 transition-all group">
                <div className="text-5xl font-black font-mono mb-3 leading-none transition-colors" style={{ color: 'rgba(228,77,40,0.15)' }}>{s.n}</div>
                <h3 className="text-base font-black text-foreground mb-1.5">{s.t}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(246,245,242,0.48)' }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Innovation Readiness Framework */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">Fusion 8 IP</p>
            <h2 className="text-section text-foreground mb-4">The Innovation Readiness Framework.</h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: 'rgba(246,245,242,0.50)' }}>
              Every project receives a score across 5 dimensions. The overall grade determines your next step.
              This is how we decide who is ready for the Accelerator.
            </p>
          </div>

          {/* 5 dimensions */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto mb-14">
            {DIMENSIONS.map((d, i) => {
              const Icon = d.icon;
              return (
                <div key={d.title} className="bg-card border border-white/[0.07] hover:border-accent/20 rounded-2xl p-6 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="h-4.5 w-4.5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">{d.title}</p>
                      <p className="text-[10px] font-bold text-accent/70 uppercase tracking-wider">0 – 100</p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(246,245,242,0.50)' }}>{d.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Grade scale */}
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-center mb-6" style={{ color: 'rgba(246,245,242,0.38)' }}>Overall Grades</p>
            <div className="space-y-2.5">
              {GRADES.map(g => (
                <div key={g.grade} className={`flex items-center gap-5 p-4 rounded-xl border ${g.color} transition-all`}>
                  <div className="text-2xl font-black font-mono w-12 text-center shrink-0">{g.grade}</div>
                  <div className="w-px h-8 bg-white/10 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-black">{g.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(246,245,242,0.45)' }}>{g.desc}</p>
                  </div>
                  <div className="text-xs font-mono font-bold shrink-0" style={{ color: 'rgba(246,245,242,0.35)' }}>{g.range}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Real photo break */}
      <section className="relative h-56 md:h-64 overflow-hidden">
        <Image src={IMAGES.whiteboardTeam} alt="Team collaborating on innovation" fill className="object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,14,16,0.3) 0%, rgba(10,14,16,0.75) 100%)' }} />
        <div className="absolute bottom-8 left-0 right-0 text-center z-10">
          <p className="font-black text-white text-xl md:text-2xl" style={{ letterSpacing: '-0.02em' }}>
            "From prototype to product — with structure at every step."
          </p>
        </div>
      </section>

      {/* What you receive */}
      <section className="bg-[#070A0C] border-y border-white/[0.06]">
        <div className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-5">What You Receive</p>
              <h2 className="text-section text-foreground mb-6">Full Support. No Guesswork.</h2>
              <ul className="space-y-3">
                {WHAT_YOU_GET.map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(246,245,242,0.70)' }}>
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card border border-accent/20 rounded-2xl p-8 text-center">
              <div className="text-6xl font-black font-mono text-accent mb-3">3</div>
              <p className="text-foreground font-black text-lg mb-1">months</p>
              <p className="text-sm mb-6" style={{ color: 'rgba(246,245,242,0.50)' }}>Standard incubation duration</p>
              <div className="w-full h-px bg-white/10 mb-6" />
              <div className="space-y-3 text-sm text-left">
                {['Open to Fusion 8 Academy graduates', 'Grade B or above at Demo Day', 'Working prototype required', 'Team of 1–4 people'].map(req => (
                  <div key={req} className="flex items-start gap-2.5" style={{ color: 'rgba(246,245,242,0.58)' }}>
                    <span className="text-accent font-black mt-0.5">→</span>{req}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-accent relative overflow-hidden">
        <div className="absolute inset-0 grid-texture opacity-[0.06]" />
        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <h2 className="font-black text-white mb-4 leading-tight" style={{ fontSize: 'clamp(1.8rem,5vw,3.5rem)', letterSpacing: '-0.03em' }}>
            Ready to Incubate Your Idea?
          </h2>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">Start with the Academy. Graduate with a grade. Apply for the Incubator.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#0A0E10] hover:bg-black text-white font-black h-13 px-8 rounded-xl shadow-2xl shadow-black/40">
              <Link href="/apply">Apply for Cohort 01 <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 h-13 px-8 rounded-xl font-bold">
              <a href="mailto:fusion8.cohort01@gmail.com">Contact the Team</a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
