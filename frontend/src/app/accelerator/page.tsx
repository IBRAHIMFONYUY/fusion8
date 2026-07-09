'use client';

import { PublicHeader } from '@/components/public-header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { IMAGES } from '@/lib/images';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Package, Settings, Factory, Truck, Globe, DollarSign } from 'lucide-react';

const MANUFACTURING_STAGES = [
  { icon: Package,  title: 'Prototype',                desc: 'Working proof of concept built in Fusion 8 Labs. Core functionality validated.' },
  { icon: Settings, title: 'Design for Manufacturing', desc: 'PCB design finalized. Bill of Materials created. Optimized for production.' },
  { icon: Factory,  title: 'Pilot Batch — 10 Units',  desc: 'First production run. Hand-assembled. Full quality testing and documentation.' },
  { icon: Package,  title: 'Small Batch — 100 Units',  desc: 'Manufacturing partner engaged. Semi-automated production. Packaging designed.' },
  { icon: Truck,    title: 'Manufacturing Partner',    desc: 'Supply chain established. Cost per unit optimized. Local or regional manufacturer.' },
  { icon: Globe,    title: 'Market Launch',             desc: 'Distribution activated. First paying customers. Revenue begins flowing.' },
];

const WHAT_YOU_RECEIVE = [
  'Commercialization strategy and go-to-market plan',
  'Investor pitch deck preparation and rehearsal',
  'Introduction to Fusion 8 investor network',
  'Strategic partnership development',
  'Product manufacturing pathway support',
  'Legal structure and company formation guidance',
  'Revenue model optimization',
  'Demo Day 2.0 — full investor presentation slot',
];

const REVENUE_STREAMS = [
  { n: '01', title: 'Talent Academy',         status: 'Active Now',     desc: 'Course fees · Cohort fees · Certification · Corporate training' },
  { n: '02', title: 'Engineering Labs',        status: 'Coming 2027',    desc: 'Lab access · Prototyping support · PCB fabrication · Equipment rental' },
  { n: '03', title: 'Product Accelerator',     status: 'Coming 2027',    desc: 'Acceleration fees · Equity participation (2–5%) · Service fees' },
  { n: '04', title: 'Innovation Marketplace',  status: 'Coming 2028',    desc: 'Project listings · Transaction fees · Partnership introductions' },
  { n: '05', title: 'Engineering Consulting',  status: 'Coming 2028',    desc: 'Industrial automation · Embedded systems · Corporate innovation' },
  { n: '06', title: 'Sponsorships',           status: 'Active',         desc: 'Universities · Tech companies · Development agencies · Government' },
  { n: '07', title: 'Venture Studio',          status: 'Coming 2029',    desc: 'Co-built startups · Equity ownership · Revenue sharing · Licensing' },
];

export default function AcceleratorPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-20 border-b border-black/[0.06] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Image src={IMAGES.manufacturingLine} alt="" fill className="object-cover opacity-[0.07]" />
          <div className="absolute inset-0 bg-background/93" />
          <div className="absolute bottom-0 right-1/3 w-[600px] h-[350px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(228,77,40,0.07) 0%, transparent 65%)' }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-5">Product Accelerator</p>
          <h1 className="text-display text-foreground mb-6 max-w-3xl mx-auto">Helping Innovators Move Beyond Prototypes.</h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto mb-10" style={{ color: 'rgba(100,116,139,0.85)' }}>
            At Fusion 8, "done" doesn't mean built a prototype. Done means
            manufactured. Distributed. Sold.
          </p>
          <div className="inline-flex items-center gap-2 border border-black/[0.10] rounded-full px-5 py-2 text-sm font-semibold" style={{ color: 'rgba(100,116,139,0.80)' }}>
            Open to Incubator graduates with Grade A or A+ · Coming 2027
          </div>
        </div>
      </section>

      {/* Manufacturing pipeline */}
      <section className="bg-[#F3F4F6] border-b border-black/[0.06]">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">The Manufacturing Pathway</p>
            <h2 className="text-section text-foreground mb-4">From Prototype to Market.</h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'rgba(100,116,139,0.80)' }}>
              This is what makes Fusion 8 different from every other incubator.
              We don't stop at prototypes.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {MANUFACTURING_STAGES.map((stage, i) => {
              const Icon = stage.icon;
              const isLast = i === MANUFACTURING_STAGES.length - 1;
              return (
                <div key={stage.title} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLast ? 'bg-accent text-white' : 'bg-accent/10 text-accent'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {!isLast && <div className="w-px flex-1 my-2" style={{ background: 'linear-gradient(to bottom, rgba(228,77,40,0.4), rgba(228,77,40,0.1))' }} />}
                  </div>
                  <div className={`pb-8 flex-1 ${isLast ? '' : ''}`}>
                    <div className={`bg-card border rounded-2xl p-5 hover:border-accent/25 transition-all ${isLast ? 'border-accent/30 bg-accent/[0.05]' : 'border-black/[0.06]'}`}>
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest font-mono" style={{ color: 'rgba(228,77,40,0.60)' }}>Stage {String(i + 1).padStart(2, '0')}</span>
                        {isLast && <span className="text-[9px] font-black uppercase tracking-widest bg-accent text-white px-2 py-0.5 rounded-full">Goal</span>}
                      </div>
                      <h3 className={`text-sm font-black mb-1 ${isLast ? 'text-accent' : 'text-foreground'}`}>{stage.title}</h3>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(100,116,139,0.80)' }}>{stage.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What you receive */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-5">What You Receive</p>
              <h2 className="text-section text-foreground mb-6">Full Stack Support. From MVP to Market.</h2>
              <ul className="space-y-3">
                {WHAT_YOU_RECEIVE.map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(51,65,85,0.80)' }}>
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <div className="bg-card border border-black/[0.06] rounded-2xl p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-3">Equity Terms</p>
                <p className="text-4xl font-black text-foreground mb-1">2–5<span className="text-xl">%</span></p>
                <p className="text-sm" style={{ color: 'rgba(100,116,139,0.80)' }}>Negotiated equity in exchange for commercialization support, lab access, and market development. Agreed in writing before acceleration begins.</p>
              </div>
              <div className="bg-card border border-black/[0.06] rounded-2xl p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-3">Duration</p>
                <p className="text-4xl font-black text-foreground mb-1">3 <span className="text-xl font-semibold" style={{ color: 'rgba(100,116,139,0.80)' }}>months</span></p>
                <p className="text-sm" style={{ color: 'rgba(100,116,139,0.80)' }}>Standard acceleration track. Extended to 6 months for hardware-heavy products requiring manufacturing setup.</p>
              </div>
              <div className="bg-card border border-accent/20 rounded-2xl p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-3">Entry Requirement</p>
                <p className="text-2xl font-black text-foreground mb-1">Grade A or A+</p>
                <p className="text-sm" style={{ color: 'rgba(100,116,139,0.80)' }}>Innovation Readiness Score of 75 or above from the Incubator. Your product must be validated with real users.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real photo break */}
      <section className="relative h-56 md:h-64 overflow-hidden">
        <Image src={IMAGES.presentingDemo} alt="Demo Day — Fusion 8 founders presenting to investors" fill className="object-cover object-center" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(10,14,16,0.80) 0%, rgba(10,14,16,0.35) 60%, rgba(228,77,40,0.05) 100%)' }} />
        <div className="absolute inset-0 flex items-center px-8 md:px-16">
          <div className="max-w-lg">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-2">Investor Day</p>
            <p className="font-black text-white text-xl md:text-3xl leading-tight" style={{ letterSpacing: '-0.02em' }}>
              Present to investors. Raise funding. Launch your company.
            </p>
          </div>
        </div>
      </section>

      {/* Revenue model */}
      <section className="bg-[#F3F4F6] border-y border-black/[0.06]">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">Fusion 8 Revenue Model</p>
            <h2 className="text-section text-foreground mb-4">7 Revenue Streams. Built to Last.</h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'rgba(100,116,139,0.75)' }}>
              Fusion 8 is designed to generate sustainable revenue while delivering maximum impact.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {REVENUE_STREAMS.map(r => {
              const isActive = r.status.includes('Active');
              return (
                <div key={r.n} className={`bg-card border rounded-2xl p-5 hover:border-accent/25 transition-all ${isActive ? 'border-accent/20' : 'border-black/[0.06]'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black font-mono text-accent/60">{r.n}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${isActive ? 'bg-accent text-white' : 'bg-black/[0.04]'}`} style={{ color: isActive ? undefined : 'rgba(246,245,242,0.38)' }}>
                      {r.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-foreground mb-1.5">{r.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(100,116,139,0.75)' }}>{r.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-accent relative overflow-hidden">
        <div className="absolute inset-0 grid-texture opacity-[0.06]" />
        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <h2 className="font-black text-white mb-4 leading-tight" style={{ fontSize: 'clamp(1.8rem,5vw,3.5rem)', letterSpacing: '-0.03em' }}>
            The Path Starts at the Academy.
          </h2>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">Apply for Cohort 01. Graduate. Build your prototype. Then we accelerate together.</p>
          <Button asChild size="lg" className="bg-[#0A0E10] hover:bg-black text-white font-bold h-12 px-7 rounded-xl shadow-2xl shadow-black/40 transition-all">
            <Link href="/apply">Apply for Cohort 01 <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
