'use client';

import { PublicHeader } from '@/components/public-header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { IMAGES } from '@/lib/images';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MessageCircle, GraduationCap, DollarSign, Users, BookOpen } from 'lucide-react';

const ALUMNI_DO = [
  { icon: GraduationCap, title: 'Mentor',  desc: 'Mentor the next cohort as a subject-matter expert. Share what you learned the hard way.' },
  { icon: DollarSign,    title: 'Invest',   desc: 'Invest in future Fusion 8 startups as an early angel. Build the ecosystem you benefited from.' },
  { icon: Users,         title: 'Hire',     desc: 'Hire from the Fusion 8 talent pool. You know the quality because you trained alongside them.' },
  { icon: BookOpen,      title: 'Teach',    desc: 'Lead specialist workshops and guest sessions. Turn your expertise into impact.' },
];

const EVENTS = [
  { title: 'Demo Day — Cohort 01', date: 'Week 7 of Cohort 01', desc: 'Live project presentations. Innovation Readiness Scores. Certificate ceremony.', status: 'upcoming' },
  { title: 'Open Lab Day', date: 'Monthly — TBA', desc: 'Makers, students, and engineers open to come build, explore, and collaborate.', status: 'planned' },
  { title: 'Investor Day 2.0', date: '2027', desc: 'Top incubated startups pitch to investors, government, and industry partners.', status: 'future' },
];

export default function CommunityPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-20 border-b border-black/[0.06] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Image src={IMAGES.studentGroup} alt="" fill className="object-cover opacity-[0.09]" />
          <div className="absolute inset-0 bg-background/92" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(228,77,40,0.07) 0%, transparent 65%)' }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-5">Community</p>
          <h1 className="text-display text-foreground mb-6 max-w-3xl mx-auto">Every Graduate Is a Node in the Network.</h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto mb-10" style={{ color: 'rgba(100,116,139,0.85)' }}>
            The Fusion 8 community doesn't end at graduation. It accelerates after it.
            Builders helping builders. Engineers investing in engineers.
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-orange-600 text-white font-bold h-12 px-7 rounded-xl shadow-lg shadow-accent/20 transition-all hover:shadow-xl">
            <a href="https://chat.whatsapp.com/LflIGcSgE0AKgGlBmL01fD" target="_blank" rel="noopener noreferrer">
              Join WhatsApp Community <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* WhatsApp CTA — big */}
      <section className="bg-[#F3F4F6] border-b border-black/[0.06]">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto bg-card border border-black/[0.06] rounded-3xl p-10 text-center hover:border-accent/20 transition-all">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: '#25D366' }}>
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-3">Join the WhatsApp Community</h2>
            <p className="text-sm mb-7" style={{ color: 'rgba(100,116,139,0.85)' }}>
              Get program updates, session reminders, peer support, and direct access
              to the Fusion 8 team. 100+ members and growing.
            </p>
            <Button asChild size="lg" className="font-black h-12 px-8 rounded-xl text-white" style={{ background: '#25D366' }}>
              <a href="https://chat.whatsapp.com/LflIGcSgE0AKgGlBmL01fD" target="_blank" rel="noopener noreferrer">
                Join Now — It&apos;s Free
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Alumni flywheel */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">The Alumni Network</p>
            <h2 className="text-section text-foreground mb-4">The Flywheel Effect.</h2>
            <p className="text-base max-w-xl mx-auto mb-10" style={{ color: 'rgba(100,116,139,0.80)' }}>
              Every Fusion 8 graduate strengthens the ecosystem for the next generation.
            </p>
            {/* Flywheel visual */}
            <div className="flex flex-wrap justify-center items-center gap-0 max-w-2xl mx-auto mb-14">
              {['Train', 'Build', 'Graduate', 'Mentor', 'Invest', 'Hire'].map((step, i) => (
                <div key={step} className="flex items-center">
                  <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${i === 0 ? 'bg-accent text-white' : 'border border-black/[0.10] text-foreground/60'}`}>
                    {step}
                  </div>
                  <span className="text-accent/50 font-black mx-1 text-lg">→</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {ALUMNI_DO.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-card border border-black/[0.06] hover:border-accent/20 rounded-2xl p-6 transition-all text-center">
                  <div className="w-11 h-11 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-base font-black text-foreground mb-2">{item.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(100,116,139,0.80)' }}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="bg-[#F3F4F6] border-y border-black/[0.06]">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">Events</p>
            <h2 className="text-section text-foreground">Where the Community Gathers.</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {EVENTS.map(e => {
              const isUpcoming = e.status === 'upcoming';
              return (
                <div key={e.title} className={`bg-card border rounded-2xl p-6 transition-all ${isUpcoming ? 'border-accent/25' : 'border-black/[0.06]'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className={`text-base font-black mb-1 ${isUpcoming ? 'text-accent' : 'text-foreground'}`}>{e.title}</h3>
                      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(100,116,139,0.60)' }}>{e.date}</p>
                      <p className="text-sm" style={{ color: 'rgba(100,116,139,0.85)' }}>{e.desc}</p>
                    </div>
                    <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${isUpcoming ? 'bg-accent text-white' : 'bg-black/[0.04]'}`} style={{ color: isUpcoming ? undefined : 'rgba(246,245,242,0.35)' }}>
                      {e.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Real photo break — team in action */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <Image src={IMAGES.startupRoom} alt="Fusion 8 community builders" fill className="object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,14,16,0.85) 0%, rgba(10,14,16,0.30) 60%)' }} />
        <div className="absolute bottom-8 left-0 right-0 text-center z-10 px-4">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-2">The Network Effect</p>
          <p className="font-black text-white text-xl md:text-3xl max-w-2xl mx-auto leading-tight" style={{ letterSpacing: '-0.03em' }}>
            Every builder you meet here is a future co-founder, investor, or customer.
          </p>
        </div>
      </section>

      {/* Alumni wall placeholder */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-20 max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-5">Alumni Wall</p>
          <h2 className="text-section text-foreground mb-6">Where Africa&apos;s Next Generation of Builders Is Documented.</h2>
          <div className="border border-dashed border-black/[0.10] rounded-2xl p-12 mb-8">
            <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(100,116,139,0.60)' }}>Cohort 01 graduates join the wall on Demo Day.</p>
            <p className="text-xs" style={{ color: 'rgba(100,116,139,0.40)' }}>30 faces. 30 stories. One movement.</p>
          </div>
          <Button asChild size="lg" className="bg-accent hover:bg-orange-600 text-white font-black h-12 px-7 rounded-xl shadow-xl shadow-accent/25">
            <Link href="/apply">Secure Your Spot <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
