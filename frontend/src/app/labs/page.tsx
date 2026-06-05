'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Cpu, Zap, Bot, FlaskConical, Layers, Wrench } from 'lucide-react';

const LAB_SERVICES = [
  { icon: Bot,         title: 'Robotics Bench',         desc: 'Servo motors, stepper drivers, gripper assemblies, motor controllers, chassis kits.', status: 'Available' },
  { icon: Cpu,         title: 'Electronics Workbench',  desc: 'Oscilloscopes, multimeters, power supplies, soldering stations, component drawers.', status: 'Available' },
  { icon: Zap,         title: 'IoT Development Kits',   desc: 'ESP32, NodeMCU, Raspberry Pi, Arduino Mega and Uno boards, sensor libraries.', status: 'Available' },
  { icon: Layers,      title: 'PCB Design & Fab',        desc: 'KiCad/EasyEDA workstations, PCB prototyping service, gerber file submission.', status: 'Coming 2027' },
  { icon: FlaskConical,'title': '3D Printing',           desc: 'FDM printers for rapid casing prototypes, brackets, and mechanical components.', status: 'Coming 2027' },
  { icon: Wrench,      title: 'Assembly & Testing',      desc: 'Full assembly bench, functional testing rigs, quality validation tools.', status: 'Coming 2027' },
];

const PRICING = [
  { label: 'Student Session',   price: 'Free',         note: 'Academy students · during cohort weeks' },
  { label: 'Hourly Access',     price: '500 XAF/hr',   note: 'Alumni and individual makers · booking required' },
  { label: 'Monthly Membership',price: '5,000 XAF/mo', note: 'Unlimited access · priority booking · storage locker' },
  { label: 'Project Package',   price: 'Custom',       note: 'Incubator and Accelerator teams · full project support' },
];

export default function LabsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-20 grid-texture border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(228,77,40,0.07) 0%, transparent 65%)' }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-5">Engineering Labs</p>
          <h1 className="text-display text-foreground mb-6 max-w-3xl mx-auto">Where Ideas Become Working Systems.</h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto mb-10" style={{ color: 'rgba(246,245,242,0.55)' }}>
            The Fusion 8 Lab in Bamenda gives engineers access to real hardware,
            professional tools, and an environment built for serious builders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-accent hover:bg-orange-600 text-white font-black h-13 px-8 rounded-xl shadow-2xl shadow-accent/25">
              <Link href="/apply">Start at the Academy <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 text-foreground hover:bg-white/5 h-13 px-8 rounded-xl font-semibold">
              <a href="mailto:fusion8.cohort01@gmail.com">Inquire About Access</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Current lab */}
      <section className="bg-[#070A0C] border-b border-white/[0.06]">
        <div className="container mx-auto px-4 py-14">
          <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-4">
            {[
              { n: 'Bamenda', l: 'Lab Location', sub: 'Northwest Region, Cameroon' },
              { n: 'Now', l: 'Status', sub: 'Active — Cohort 01 in session' },
              { n: '2027', l: 'Full Lab Opening', sub: 'PCB fab + 3D printing + CNC' },
            ].map(s => (
              <div key={s.l} className="bg-card border border-white/[0.07] rounded-2xl p-5 text-center">
                <div className="text-2xl font-black text-accent mb-0.5">{s.n}</div>
                <div className="text-xs font-black uppercase tracking-wider text-foreground mb-1">{s.l}</div>
                <div className="text-[10px]" style={{ color: 'rgba(246,245,242,0.42)' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">Lab Equipment & Services</p>
            <h2 className="text-section text-foreground">Everything You Need to Build.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {LAB_SERVICES.map(s => {
              const Icon = s.icon;
              const isAvailable = s.status === 'Available';
              return (
                <div key={s.title} className={`bg-card border rounded-2xl p-6 hover:border-accent/25 transition-all ${isAvailable ? 'border-accent/15' : 'border-white/[0.07]'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isAvailable ? 'bg-accent/15' : 'bg-white/[0.05]'}`}>
                      <Icon className={`h-4.5 w-4.5 ${isAvailable ? 'text-accent' : 'text-foreground/30'}`} />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${isAvailable ? 'bg-accent text-white' : 'bg-white/[0.06]'}`} style={{ color: isAvailable ? undefined : 'rgba(246,245,242,0.35)' }}>
                      {s.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-foreground mb-1.5">{s.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(246,245,242,0.48)' }}>{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-[#070A0C] border-y border-white/[0.06]">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">Access Plans</p>
            <h2 className="text-section text-foreground">Built for Builders at Every Stage.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {PRICING.map((p, i) => (
              <div key={p.label} className={`bg-card border rounded-2xl p-6 text-center hover:border-accent/25 transition-all ${i === 0 ? 'border-accent/25' : 'border-white/[0.07]'}`}>
                <p className="text-xs font-black uppercase tracking-wider mb-3 text-foreground">{p.label}</p>
                <p className={`text-2xl font-black mb-2 ${i === 0 ? 'text-accent' : 'text-foreground'}`}>{p.price}</p>
                <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(246,245,242,0.42)' }}>{p.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future vision */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-20 max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-5">Vision 2027</p>
          <h2 className="text-section text-foreground mb-6">The Full Lab Is Coming.</h2>
          <p className="text-base leading-relaxed mb-10" style={{ color: 'rgba(246,245,242,0.55)' }}>
            By 2027, the Fusion 8 Engineering Lab will feature PCB fabrication machines,
            industrial 3D printers, CNC routers, electronics testing benches, and a
            dedicated hardware library — the most complete maker facility in the Northwest Region.
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-orange-600 text-white font-black h-13 px-8 rounded-xl shadow-2xl shadow-accent/25">
            <Link href="/apply">Join the First Cohort <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
