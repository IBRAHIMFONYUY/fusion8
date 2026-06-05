'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { IMAGES } from '@/lib/images';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Shield, Lightbulb, Users, Rocket, Zap, Globe } from 'lucide-react';

const JOURNEY = [
  { stage: '01', title: 'Student', desc: 'You arrive with curiosity or a problem you want to solve. No prior experience required.' },
  { stage: '02', title: 'Fusion 8 Academy', desc: '7 weeks of hands-on hardware and IoT training. Arduino, Sensors, Robotics, Design Thinking.' },
  { stage: '03', title: 'First Project', desc: 'You identify a real problem in your community and build your first working prototype.' },
  { stage: '04', title: 'Demo Day', desc: 'Week 7. Present to real engineers. Judged on idea, execution, presentation, and potential.' },
  { stage: '05', title: 'Innovation Team', desc: 'Top graduates join cross-disciplinary teams. Problem validated. Research completed.' },
  { stage: '06', title: 'Incubation', desc: 'Your idea enters the incubator. Mentorship, lab access, business development. Prototype to MVP.' },
  { stage: '07', title: 'MVP Validation', desc: 'MVP tested with real users. Innovation Readiness Score assigned. Grade A+ moves to Acceleration.' },
  { stage: '08', title: 'Acceleration', desc: 'Commercialization support, investor readiness, manufacturing pathway begins.' },
  { stage: '09', title: 'Pilot Manufacturing', desc: '10-unit pilot batch produced. PCB fabrication, assembly, quality validation.' },
  { stage: '10', title: 'Investor Day', desc: 'Present to investors, industry partners, and government. Seek pre-seed funding.' },
  { stage: '11', title: 'Company Formation', desc: 'Register your startup. Build your team. Launch to market. Fusion 8 Venture Studio supports you.' },
  { stage: '12', title: 'Alumni Network', desc: 'Join the network. Mentor the next cohort. Invest in future startups. The flywheel continues.' },
];

const VALUES = [
  { icon: Zap,        title: 'Build Before You Talk',         desc: 'Execution is the only currency that matters here.' },
  { icon: Rocket,     title: 'Execution Over Excuses',        desc: 'We have no patience for reasons why it cannot be done.' },
  { icon: Lightbulb,  title: 'Solve Real Problems',           desc: 'Africa has enough ideas. We need solutions that work.' },
  { icon: Users,      title: 'Collaboration Over Competition', desc: 'The best products are built by teams, not individuals.' },
  { icon: Globe,      title: 'Think Globally. Build For Africa.', desc: 'World-class standards, African context, African impact.' },
  { icon: Shield,     title: 'Excellence Through Discipline', desc: 'Mastery is earned daily, not granted at graduation.' },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-20 border-b border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Image src={IMAGES.teamWorking} alt="" fill className="object-cover opacity-[0.08]" />
          <div className="absolute inset-0 bg-background/90" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(228,77,40,0.07) 0%, transparent 65%)' }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-5">About Fusion 8</p>
          <h1 className="text-display text-foreground mb-6 max-w-4xl mx-auto">
            Fusion 8 is building the infrastructure, talent, and innovation pipeline required to transform African ideas into globally competitive products.
          </h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: 'rgba(246,245,242,0.55)' }}>
            Based in Bamenda, Northwest Region, Cameroon. Founded 2026. Cohort 01.
          </p>
        </div>
      </section>

      {/* What we are / are not */}
      <section className="bg-[#070A0C] border-b border-white/[0.06]">
        <div className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-5">Fusion 8 Is</p>
              <ul className="space-y-3">
                {['A hardtech innovation ecosystem', 'A product acceleration platform', 'A talent development engine', 'A startup launchpad', 'The bridge between engineering education and industrial innovation'].map(s => (
                  <li key={s} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(246,245,242,0.72)' }}>
                    <span className="text-accent font-black mt-0.5">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] mb-5" style={{ color: 'rgba(246,245,242,0.35)' }}>Fusion 8 Is Not</p>
              <ul className="space-y-3">
                {['A robotics club', 'A coding bootcamp', 'A student association', 'An event organization', 'A traditional training center'].map(s => (
                  <li key={s} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(246,245,242,0.38)' }}>
                    <span className="mt-0.5 font-black" style={{ color: 'rgba(246,245,242,0.25)' }}>✕</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Full-width image break */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <Image src={IMAGES.electronicsLab} alt="Fusion 8 Engineering Lab" fill className="object-cover" />
        <div className="absolute inset-0 bg-background/70" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center z-10">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-3">The Innovation Pipeline</p>
            <p className="font-black text-foreground text-2xl md:text-4xl" style={{ letterSpacing: '-0.03em' }}>
              TALENT → BUILDERS → PROTOTYPES → PRODUCTS → INDUSTRIES
            </p>
          </div>
        </div>
      </section>

      {/* The 12-stage founder journey */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">The Founder Journey</p>
            <h2 className="text-section text-foreground mb-4">12 Stages from Student to Founder.</h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'rgba(246,245,242,0.50)' }}>
              Every graduate starts at Stage 01. The pipeline does the rest.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {JOURNEY.map((j, i) => (
              <div key={j.stage} className={`relative bg-card border rounded-2xl p-6 hover:border-accent/25 transition-all group ${i === 0 ? 'border-accent/25 bg-accent/[0.04]' : 'border-white/[0.07]'}`}>
                <div className="text-5xl font-black font-mono mb-3 leading-none" style={{ color: i === 0 ? 'rgba(228,77,40,0.35)' : 'rgba(246,245,242,0.08)' }}>{j.stage}</div>
                <h3 className={`text-sm font-black mb-1.5 ${i === 0 ? 'text-accent' : 'text-foreground'}`}>{j.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(246,245,242,0.48)' }}>{j.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core values */}
      <section className="bg-[#070A0C] border-y border-white/[0.06]">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">Core Values</p>
            <h2 className="text-section text-foreground">What We Stand For.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {VALUES.map(v => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="bg-card border border-white/[0.07] hover:border-accent/20 rounded-2xl p-6 transition-all">
                  <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <h3 className="text-sm font-black text-foreground mb-1.5">{v.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(246,245,242,0.50)' }}>{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* IP & equity */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-20 max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">IP & Equity</p>
            <h2 className="text-section text-foreground">Your Idea. Your Company.</h2>
          </div>
          <div className="space-y-6">
            {[
              { q: 'Who owns ideas developed in Fusion 8?', a: 'The founder always owns their idea. Fusion 8 never claims ownership of projects developed through our Academy or Incubator.' },
              { q: 'Does Fusion 8 take equity?', a: 'Only at the Accelerator stage. We may negotiate a small stake (2–5%) in exchange for commercialization support, lab access, and market development. Agreed in writing before acceleration begins.' },
              { q: 'What about IP and patents?', a: 'We help founders document and protect their intellectual property. Fusion 8 does not claim patent ownership — we support the filing process.' },
              { q: 'Can a founder leave at any time?', a: 'Yes. The Academy and Incubator are open-access. The only binding agreement begins at the Accelerator stage, when equity and services are formally contracted.' },
            ].map(item => (
              <div key={item.q} className="bg-card border border-white/[0.07] hover:border-accent/15 rounded-2xl p-6 transition-all">
                <h3 className="text-sm font-black text-foreground mb-2">{item.q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(246,245,242,0.58)' }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision 2032 + CTA */}
      <section className="bg-accent relative overflow-hidden">
        <div className="absolute inset-0 grid-texture opacity-[0.06]" />
        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <h2 className="font-black text-white mb-4 leading-tight" style={{ fontSize: 'clamp(1.8rem,5vw,3.5rem)', letterSpacing: '-0.03em' }}>
            "By 2032, Fusion 8 will be Africa's leading hardtech product acceleration ecosystem."
          </h2>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">Your decision to apply today is the first step in that future.</p>
          <Button asChild size="lg" className="bg-[#0A0E10] hover:bg-black text-white font-black h-13 px-8 rounded-xl shadow-2xl shadow-black/40">
            <Link href="/apply">Apply for Cohort 01 <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
