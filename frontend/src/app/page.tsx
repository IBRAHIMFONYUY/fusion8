'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { IMAGES } from '@/lib/images';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ArrowRight, Check, Clock, Cpu, Zap, Bot, Brain, Leaf, Heart, Factory, Building2, Globe, Truck, Droplets, BookOpen } from 'lucide-react';

/* ── Data ─────────────────────────────────────────────────────────────────── */
const HEADLINES = [
  { line1: "Africa doesn't have an idea problem.", line2: "It has an execution problem." },
  { line1: "Great ideas don't change the world.", line2: "Built products do." },
  { line1: "Building Africa's next", line2: "generation of innovators." },
];

const COURSES = [
  {
    image: IMAGES.arduinoBoard,
    badge: 'Week 1–2',
    title: 'Hardware Foundations',
    desc: 'Electronics basics, circuit reading, breadboard prototyping, and lab setup. Build your first circuit on Day 1.',
    tag: 'Arduino · Electronics',
    href: '/courses',
    duration: '10 hours',
  },
  {
    image: IMAGES.iotDevices,
    badge: 'Week 3–4',
    title: 'IoT & Connectivity',
    desc: 'Connect sensors to the cloud. Build real-time dashboards. Wi-Fi, MQTT, data pipelines.',
    tag: 'IoT · Networking',
    href: '/courses',
    duration: '10 hours',
  },
  {
    image: IMAGES.robotics,
    badge: 'Week 5–7',
    title: 'Robotics & Demo Day',
    desc: 'Build your final project. Validate with real users. Present to engineers and investors on Demo Day.',
    tag: 'Robotics · Innovation',
    href: '/courses',
    duration: '15 hours',
  },
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

const PIPELINE = [
  { n: '01', t: 'Student',         d: 'Arrive with curiosity or a problem you want to solve.' },
  { n: '02', t: 'Academy',         d: '7 weeks of hands-on hardware and IoT training.' },
  { n: '03', t: 'Demo Day',        d: 'Present to real engineers. Judged on execution.' },
  { n: '04', t: 'Incubator',       d: 'Mentorship, lab access, prototype to MVP.' },
  { n: '05', t: 'Accelerator',     d: 'Commercialization, manufacturing, investor readiness.' },
  { n: '06', t: 'Founder',         d: 'Launch your company. Build your team. Ship.' },
];

export default function HomePage() {
  const [hIdx, setHIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHIdx(i => (i + 1) % HEADLINES.length), 4500);
    return () => clearInterval(t);
  }, []);

  const h = HEADLINES[hIdx];
  const fadeUp: Variants = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } };
  const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative pt-32 pb-20 border-b border-black/[0.06] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Image src={IMAGES.heroLab} alt="" fill className="object-cover opacity-[0.07]" />
          <div className="absolute inset-0 bg-background/92" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(228,77,40,0.08) 0%, transparent 65%)' }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Now Enrolling — Cohort 01</span>
          </motion.div>

          <div className="min-h-[8rem] md:min-h-[10rem] flex flex-col justify-center mb-6">
            <AnimatePresence mode="wait">
              <motion.div key={hIdx}
                initial={{ opacity: 0, filter: 'blur(8px)', y: 12 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                exit={{ opacity: 0, filter: 'blur(8px)', y: -12 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="text-display text-foreground mb-2">{h.line1}</h1>
                <h1 className="text-display text-accent">{h.line2}</h1>
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }}
            className="text-base md:text-lg max-w-2xl mx-auto mb-10" style={{ color: 'rgba(100,116,139,0.85)' }}>
            Building the talent, systems, and infrastructure required to turn African innovation into global impact. Starting in Bamenda, Cameroon.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-accent hover:bg-orange-600 text-white font-bold h-12 px-7 rounded-xl shadow-lg shadow-accent/20 transition-all hover:shadow-xl">
              <Link href="/apply">Apply for Cohort 01 <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-black/[0.12] text-foreground hover:bg-black/[0.03] rounded-xl h-12 px-7 font-semibold">
              <Link href="/courses">Explore Programs</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ STATS BAR ═══════════════ */}
      <section className="bg-[#F3F4F6] border-b border-black/[0.06]">
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { n: '7', l: 'Weeks' },
              { n: '30', l: 'Students Max' },
              { n: '5K', l: 'XAF Fee' },
              { n: '12', l: 'Future Tracks' },
            ].map(s => (
              <div key={s.l} className="bg-card border border-black/[0.06] rounded-2xl p-5 text-center">
                <div className="text-3xl font-black font-mono text-accent mb-1">{s.n}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ THE PROBLEM ═══════════════ */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center max-w-5xl mx-auto">

            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7 }}>
              <div className="relative rounded-2xl overflow-hidden aspect-[4/5] border border-black/[0.06]">
                <Image src={IMAGES.studentLaptop} alt="African engineering student" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="text-6xl md:text-7xl font-black font-mono text-white leading-none mb-2">
                    90<span className="text-accent text-3xl">%</span>
                  </div>
                  <p className="text-sm font-semibold text-white/80">of Cameroon&apos;s workforce operates in the informal sector.</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="space-y-8">
              <motion.div variants={fadeUp}>
                <p className="section-label">The Status Quo</p>
                <h2 className="text-section text-foreground mb-4">Why We Must Build.</h2>
              </motion.div>

              {[
                { t: 'Built, Graded, Forgotten.', d: 'Final year engineering projects are submitted, graded once, and abandoned. No products. No impact. The work disappears.' },
                { t: "Skills That Don't Transfer.", d: 'Brilliant graduates cannot wire a motor driver, write embedded firmware, or prototype a sensor array. The theory-to-practice gap is brutal.' },
                { t: "No Infrastructure.", d: 'There are no labs, no incubators, no accelerators. The pipeline from idea to product simply does not exist.' },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} className="bg-card border border-black/[0.06] hover:border-accent/20 rounded-2xl p-6 transition-all">
                  <h3 className="text-sm font-black text-foreground mb-1.5">{item.t}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(100,116,139,0.80)' }}>{item.d}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FULL-WIDTH IMAGE BREAK ═══════════════ */}
      <section className="relative h-56 md:h-72 overflow-hidden">
        <Image src={IMAGES.labWorkshop} alt="Students in the Fusion 8 lab" fill className="object-cover object-top" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(10,14,16,0.85) 0%, rgba(10,14,16,0.40) 50%, rgba(10,14,16,0.20) 100%)' }} />
        <div className="absolute inset-0 flex items-center px-8 md:px-16">
          <div>
            <p className="section-label">The Fusion 8 Pipeline</p>
            <p className="font-black text-white text-xl md:text-3xl max-w-md leading-tight" style={{ letterSpacing: '-0.02em' }}>
              TALENT → BUILDERS → PROTOTYPES → PRODUCTS → INDUSTRIES
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ ACADEMY COURSES ═══════════════ */}
      <section className="bg-[#F3F4F6] border-b border-black/[0.06]">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6 max-w-5xl mx-auto">
            <div>
              <p className="section-label">Fusion 8 Academy</p>
              <h2 className="text-section text-foreground">Start Building Today.</h2>
            </div>
            <Button asChild variant="outline" className="border-black/[0.10] text-foreground hover:bg-black/[0.03] rounded-xl h-12 px-7 font-semibold shrink-0">
              <Link href="/courses">Browse All Courses <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {COURSES.map((course, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Link href={course.href} className="group flex flex-col h-full bg-card border border-black/[0.06] rounded-2xl overflow-hidden hover:border-accent/25 transition-all">
                  <div className="relative h-56 overflow-hidden">
                    <Image src={course.image} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 right-4">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-accent text-white px-2.5 py-1 rounded-full">{course.badge}</span>
                    </div>
                    <div className="absolute bottom-4 left-5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{course.tag}</span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-base font-black text-foreground mb-2 group-hover:text-accent transition-colors">{course.title}</h3>
                    <p className="text-xs leading-relaxed mb-6 flex-1" style={{ color: 'rgba(100,116,139,0.80)' }}>{course.desc}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-black/[0.06]">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />{course.duration}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-foreground group-hover:text-accent transition-colors">
                        Enroll <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ THE PIPELINE — 6 STAGES ═══════════════ */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="text-center mb-14">
            <p className="section-label">The Founder Journey</p>
            <h2 className="text-section text-foreground mb-4">From Student to Founder. 6 Stages.</h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: 'rgba(100,116,139,0.80)' }}>
              Every graduate starts at Stage 01. The pipeline does the rest.
            </p>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {PIPELINE.map((p, i) => (
              <motion.div key={p.n} variants={fadeUp}
                className={`relative bg-card border rounded-2xl p-6 hover:border-accent/25 transition-all group ${i === 0 ? 'border-accent/25 bg-accent/[0.04]' : 'border-black/[0.06]'}`}
              >
                <div className="text-5xl font-black font-mono mb-3 leading-none transition-colors" style={{ color: i === 0 ? 'rgba(228,77,40,0.35)' : 'rgba(100,116,139,0.15)' }}>{p.n}</div>
                <h3 className={`text-sm font-black mb-1.5 ${i === 0 ? 'text-accent' : 'text-foreground'}`}>{p.t}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(100,116,139,0.75)' }}>{p.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ FUTURE TRACKS ═══════════════ */}
      <section className="bg-[#F3F4F6] border-y border-black/[0.06]">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="text-center mb-14">
            <p className="section-label">Future Courses</p>
            <h2 className="text-section text-foreground mb-4">This Is Just the Beginning.</h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: 'rgba(100,116,139,0.75)' }}>Fusion 8 will expand into 14 industry tracks by 2030.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
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

      {/* ═══════════════ COHORT 01 — CTA ═══════════════ */}
      <section className="bg-accent relative overflow-hidden">
        <div className="absolute inset-0 grid-texture opacity-[0.06]" />
        <div className="container mx-auto px-4 py-24 text-center relative z-10">
          <h2 className="font-black text-white mb-4 leading-tight" style={{ fontSize: 'clamp(1.8rem,5vw,3.5rem)', letterSpacing: '-0.03em' }}>
            30 spots. 7 weeks. 5,000 XAF.
          </h2>
          <p className="text-white/75 mb-8 max-w-lg mx-auto">Secure your place in Cohort 01 before the list closes.</p>
          <Button asChild size="lg" className="bg-[#0A0E10] hover:bg-black text-white font-bold h-12 px-7 rounded-xl shadow-2xl shadow-black/40 transition-all">
            <Link href="/apply">Apply Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
