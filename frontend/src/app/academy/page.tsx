'use client';

import { PublicHeader } from '@/components/public-header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { IMAGES } from '@/lib/images';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Bot, Brain, Cpu, Zap, Leaf, Heart, Factory, Building2, Globe, Truck, Droplets, BookOpen } from 'lucide-react';

const CURRICULUM = [
  { week: 'Week 1', title: 'Orientation & Foundations', topics: ['Electronics fundamentals', 'Lab safety & equipment', 'Ohm\'s law in practice', 'Team formation & Design Thinking intro'], phase: 'Foundation' },
  { week: 'Week 2', title: 'Arduino & Microcontrollers', topics: ['Arduino IDE setup', 'Digital & analog I/O', 'PWM & servo motors', 'Serial communication'], phase: 'Hardware' },
  { week: 'Week 3', title: 'Sensors & Actuators', topics: ['Temperature, humidity, motion sensors', 'Motor drivers (L298N)', 'IR & ultrasonic ranging', 'Building your first robot arm'], phase: 'Hardware' },
  { week: 'Week 4', title: 'IoT Foundations', topics: ['ESP8266 / ESP32 Wi-Fi', 'MQTT protocol', 'Cloud dashboard (ThingSpeak)', 'Real-time sensor monitoring'], phase: 'IoT' },
  { week: 'Week 5', title: 'Connected Systems', topics: ['Node-RED flows', 'Mobile notifications', 'Remote control via web app', 'Multi-device coordination'], phase: 'IoT' },
  { week: 'Week 6', title: 'Design Thinking & MVP', topics: ['Problem framing (HMW method)', 'User research techniques', 'Rapid prototyping', 'Business model canvas intro'], phase: 'Prototype' },
  { week: 'Week 7', title: '🔥 DEMO DAY', topics: ['Final project presentation', 'Live demo to engineers & investors', 'Innovation Readiness Score', 'Certificate awarded'], phase: 'Demo Day' },
];

const TRACKS = [
  { icon: Bot,       label: 'Robotics & Automation',   status: 'now'  },
  { icon: Brain,     label: 'AI & Intelligent Systems', status: 'soon' },
  { icon: Cpu,       label: 'Embedded Systems',         status: 'soon' },
  { icon: Zap,       label: 'Renewable Energy',         status: 'soon' },
  { icon: Leaf,      label: 'Smart Agriculture',        status: 'soon' },
  { icon: Heart,     label: 'Biomedical Engineering',   status: 'soon' },
  { icon: Factory,   label: 'Manufacturing & Industry', status: 'soon' },
  { icon: Building2, label: 'Smart Infrastructure',     status: 'soon' },
  { icon: Globe,     label: 'Climate Technology',       status: 'soon' },
  { icon: Truck,     label: 'Mobility & Transport',     status: 'soon' },
  { icon: Droplets,  label: 'Water & Sanitation',       status: 'soon' },
  { icon: BookOpen,  label: 'Education Technology',     status: 'soon' },
];

const PHASE_COLORS: Record<string, string> = {
  'Foundation': 'rgba(228,77,40,0.12)',
  'Hardware':   'rgba(228,77,40,0.09)',
  'IoT':        'rgba(228,77,40,0.07)',
  'Prototype':  'rgba(228,77,40,0.09)',
  'Demo Day':   'rgba(228,77,40,0.18)',
};

export default function AcademyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-20 border-b border-black/[0.06] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Image src={IMAGES.circuitBoard} alt="" fill className="object-cover opacity-[0.07]" />
          <div className="absolute inset-0 bg-background/92" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(228,77,40,0.08) 0%, transparent 65%)' }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-5">Fusion 8 Academy</p>
          <h1 className="text-display text-foreground mb-6 max-w-3xl mx-auto">Learn the Skills Behind Tomorrow's Technologies.</h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto mb-10" style={{ color: 'rgba(100,116,139,0.85)' }}>
            Practical, hands-on engineering training using real hardware.
            No theory without application. AI-ready from day one.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-accent hover:bg-orange-600 text-white font-bold h-12 px-7 rounded-xl shadow-lg shadow-accent/20 transition-all hover:shadow-xl">
              <Link href="/apply">Apply for Cohort 01 <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-black/[0.12] text-foreground hover:bg-black/[0.03] rounded-xl h-12 px-7">
              <a href="https://chat.whatsapp.com/LflIGcSgE0AKgGlBmL01fD" target="_blank" rel="noopener noreferrer">Join WhatsApp</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Program snapshot */}
      <section className="bg-[#F3F4F6] border-b border-black/[0.06]">
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { n: '7', l: 'Weeks Total' },
              { n: '2×', l: 'Sessions/Week' },
              { n: '5h', l: 'Per Session' },
              { n: '30', l: 'Max Students' },
            ].map(s => (
              <div key={s.l} className="bg-card border border-black/[0.06] rounded-2xl p-5 text-center">
                <div className="text-3xl font-black text-accent mb-1">{s.n}</div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(100,116,139,0.70)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">Cohort 01 Curriculum</p>
            <h2 className="text-section text-foreground">Week by Week. Skill by Skill.</h2>
          </div>
          <div className="max-w-4xl mx-auto space-y-3">
            {CURRICULUM.map((week, i) => (
              <div key={week.week} className="border rounded-2xl overflow-hidden transition-all hover:border-accent/25" style={{ background: PHASE_COLORS[week.phase] || 'rgba(17,24,32,1)', borderColor: i === 6 ? 'rgba(228,77,40,0.35)' : 'rgba(246,245,242,0.07)' }}>
                <div className="flex flex-col md:flex-row md:items-start gap-4 p-6">
                  <div className="shrink-0 md:w-28">
                    <p className={`text-xs font-black uppercase tracking-wider ${i === 6 ? 'text-accent' : 'text-accent/70'}`}>{week.week}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: 'rgba(100,116,139,0.45)' }}>{week.phase}</p>
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-base font-black mb-3 ${i === 6 ? 'text-accent' : 'text-foreground'}`}>{week.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      {week.topics.map(t => (
                        <span key={t} className="text-xs px-3 py-1.5 rounded-full border" style={{ color: 'rgba(51,65,85,0.75)', borderColor: 'rgba(246,245,242,0.10)', background: 'rgba(246,245,242,0.04)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full-width photo break */}
      <section className="relative h-56 md:h-72 overflow-hidden">
        <Image src={IMAGES.mentoringPair} alt="Students and mentors in the Fusion 8 lab" fill className="object-cover object-top" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(10,14,16,0.85) 0%, rgba(10,14,16,0.40) 50%, rgba(10,14,16,0.20) 100%)' }} />
        <div className="absolute inset-0 flex items-center px-8 md:px-16">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-2">Week 7</p>
            <p className="font-black text-white text-xl md:text-3xl max-w-md leading-tight" style={{ letterSpacing: '-0.02em' }}>
              Build something real. Present it to engineers. Earn your grade.
            </p>
          </div>
        </div>
      </section>

      {/* Requirements + what you get */}
      <section className="bg-[#F3F4F6] border-y border-black/[0.06]">
        <div className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-6">Requirements</p>
              <ul className="space-y-3">
                {['Curiosity and hunger to build', 'Basic literacy in science or technology', 'Commitment to 2 sessions per week for 7 weeks', 'A problem you want to solve (or we help you find one)', '5,000 XAF program fee (hardware kit included)'].map(r => (
                  <li key={r} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(51,65,85,0.80)' }}>
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />{r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-6">What You Leave With</p>
              <ul className="space-y-3">
                {['A working hardware prototype you built yourself', 'Arduino + IoT engineering skills', 'Innovation Readiness Grade (A+ to D)', 'Fusion 8 Certificate of Completion', 'Access to the Fusion 8 alumni network', 'Priority consideration for Incubator entry'].map(r => (
                  <li key={r} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(51,65,85,0.80)' }}>
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />{r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Future tracks */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">Future Courses</p>
            <h2 className="text-section text-foreground mb-4">This Is Just the Beginning.</h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'rgba(100,116,139,0.75)' }}>Fusion 8 will expand into 14 industry tracks by 2030.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {TRACKS.map(({ icon: Icon, label, status }) => (
              <div key={label} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${status === 'now' ? 'border-accent/25' : 'bg-card border-black/[0.06]'}`} style={{ background: status === 'now' ? 'rgba(228,77,40,0.07)' : undefined }}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${status === 'now' ? 'bg-accent/15' : 'bg-black/[0.02]'}`}>
                  <Icon className={`h-3.5 w-3.5 ${status === 'now' ? 'text-accent' : 'text-foreground/30'}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold leading-tight" style={{ color: status === 'now' ? 'rgba(30,41,59,0.90)' : 'rgba(100,116,139,0.75)' }}>{label}</p>
                  <p className="text-[9px] font-black uppercase tracking-wider mt-0.5" style={{ color: status === 'now' ? 'rgba(228,77,40,0.9)' : 'rgba(100,116,139,0.40)' }}>
                    {status === 'now' ? 'Available Now' : 'Coming Soon'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-accent relative overflow-hidden">
        <div className="absolute inset-0 grid-texture opacity-[0.06]" />
        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <h2 className="font-black text-white mb-4 leading-tight" style={{ fontSize: 'clamp(1.8rem,5vw,3.5rem)', letterSpacing: '-0.03em' }}>
            30 spots. 7 weeks. 5,000 XAF.
          </h2>
          <p className="text-white/75 mb-8">Secure your place in Cohort 01 before the list closes.</p>
          <Button asChild size="lg" className="bg-[#0A0E10] hover:bg-black text-white font-bold h-12 px-7 rounded-xl shadow-2xl shadow-black/40 transition-all">
            <Link href="/apply">Apply Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
