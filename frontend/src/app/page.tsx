'use client';

import { PublicHeader } from '@/components/public-header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { IMAGES } from '@/lib/images';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  ArrowRight, Check, Clock, Cpu, Zap, Bot, Brain, Leaf, Heart,
  Factory, Building2, Globe, Truck, Droplets, BookOpen,
  Wrench, Wifi, Sun, MessageCircle, Users, GraduationCap, Lightbulb, Briefcase,
} from 'lucide-react';

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
  { icon: Bot,         label: 'Robotics & Automation',    status: 'now' },
  { icon: Brain,       label: 'AI & Intelligent Systems', status: 'soon' },
  { icon: Cpu,         label: 'Embedded Systems',         status: 'soon' },
  { icon: Zap,         label: 'Renewable Energy',         status: 'soon' },
  { icon: Leaf,        label: 'Smart Agriculture',        status: 'soon' },
  { icon: Heart,       label: 'Biomedical Engineering',   status: 'soon' },
  { icon: Factory,     label: 'Manufacturing & Industry', status: 'soon' },
  { icon: Building2,   label: 'Smart Infrastructure',     status: 'soon' },
  { icon: Globe,       label: 'Climate Technology',       status: 'soon' },
  { icon: Truck,       label: 'Mobility & Transport',     status: 'soon' },
  { icon: Droplets,    label: 'Water & Sanitation',       status: 'soon' },
  { icon: BookOpen,    label: 'Education Technology',     status: 'soon' },
];

const PIPELINE = [
  { n: '01', t: 'Student',     d: 'Arrive with curiosity or a problem you want to solve.' },
  { n: '02', t: 'Academy',     d: '7 weeks of hands-on hardware and IoT training.' },
  { n: '03', t: 'Demo Day',    d: 'Present to real engineers. Judged on execution.' },
  { n: '04', t: 'Incubator',   d: 'Mentorship, lab access, prototype to MVP.' },
  { n: '05', t: 'Accelerator', d: 'Commercialization, manufacturing, investor readiness.' },
  { n: '06', t: 'Founder',     d: 'Launch your company. Build your team. Ship.' },
];

const WHO_SHOULD_APPLY = [
  {
    icon: GraduationCap,
    title: 'STEM Students',
    desc: 'Studying engineering, physics, computer science, or any science discipline. Bridge the gap between theory and real hardware.',
    check: 'University or polytechnic enrollment preferred but not required.',
  },
  {
    icon: Lightbulb,
    title: 'Curious Tinkerers',
    desc: "Never built anything? Perfect. We start from zero. All you need is curiosity and the willingness to break things and fix them.",
    check: 'No prior experience required. Ages 16–35.',
  },
  {
    icon: Briefcase,
    title: 'Entrepreneurs',
    desc: 'You have an idea for a product but no idea how to build it. Learn the hardware skills to turn your vision into a prototype.',
    check: 'Idea-stage or early startups welcome.',
  },
  {
    icon: Wrench,
    title: 'Career Changers',
    desc: "Working in a non-technical field but want hard engineering skills? The 7-week program gives you a portfolio and a community.",
    check: 'Professionals, technicians, and self-taught builders.',
  },
];

const PROJECTS = [
  {
    image: IMAGES.projectRobot,
    title: 'Autonomous Navigation Bot',
    desc: 'Line-following robot with ultrasonic obstacle avoidance. Built in Week 6 using Arduino and custom motor drivers.',
    tags: ['Arduino', 'C++', 'Robotics'],
  },
  {
    image: IMAGES.projectIoT,
    title: 'Smart Environmental Monitor',
    desc: 'Real-time temperature, humidity, and air quality sensor that pushes data to a live dashboard via MQTT and Wi-Fi.',
    tags: ['ESP32', 'MQTT', 'IoT'],
  },
  {
    image: IMAGES.projectSolar,
    title: 'Solar Charge Controller',
    desc: 'PWM solar charging system with battery protection and a mobile-accessible monitoring interface.',
    tags: ['Energy', 'PCB Design', 'Embedded C'],
  },
];

const FAQS = [
  {
    q: 'How much does it cost and what does the fee cover?',
    a: 'The program costs 15,000 XAF for the full 7-week cohort. This covers lab access, component kits, mentorship sessions, and your Demo Day slot. There are no hidden fees. Payment is made after your application is accepted.',
  },
  {
    q: 'Do I need prior engineering or coding experience?',
    a: 'No. The academy is designed to start from absolute zero. Week 1 begins with the fundamentals of electronics. If you already have experience, you will move faster and take on more complex projects — the curriculum adapts.',
  },
  {
    q: 'Is the program in-person or online?',
    a: 'The Cohort 01 academy is primarily in-person at our lab in Bamenda, Northwest Region, Cameroon. Live sessions are also streamed via Google Meet for students who cannot attend physically. Recorded sessions are uploaded to the platform after each class.',
  },
  {
    q: 'What do I need to bring to the first session?',
    a: 'A notebook and a working laptop if you have one (not mandatory for Week 1). All hardware components are provided in the lab. You do not need to purchase any equipment before starting.',
  },
  {
    q: 'What happens after the 7 weeks?',
    a: "Graduates who demonstrate strong execution at Demo Day are invited into the Innovation Incubator — a mentorship and lab access program to take their project from prototype to MVP. The best MVPs enter the Product Accelerator for commercialization funding.",
  },
  {
    q: 'Can I apply if I\'m not based in Bamenda?',
    a: 'Yes. We accept applications from anywhere in Cameroon and the wider region. Students from outside Bamenda have attended in-person sessions on weekends and accessed streamed weekday sessions. Contact us on WhatsApp to discuss logistics.',
  },
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
      <PublicHeader />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative pt-32 pb-20 border-b border-black/[0.06] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Image src={IMAGES.heroLab} alt="" fill className="object-cover opacity-100" priority />
          <div className="absolute inset-0 bg-white/60" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
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
            className="text-base md:text-lg max-w-2xl mx-auto mb-10 text-muted-foreground">
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
              { n: '7',  l: 'Weeks' },
              { n: '30', l: 'Students Max' },
              { n: '5K', l: 'XAF Fee' },
              { n: '12', l: 'Future Tracks' },
            ].map(s => (
              <div key={s.l} className="bg-card border border-black/[0.06] rounded-2xl p-5 text-center shadow-sm">
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

            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7 }}>
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

            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className="space-y-8">
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
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.d}</p>
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
            <p className="font-black text-white text-xl md:text-3xl" style={{ letterSpacing: '-0.02em' }}>
              TALENT → BUILDERS → PROTOTYPES → PRODUCTS → INDUSTRIES
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ WHO SHOULD APPLY ═══════════════ */}
      <section className="bg-background border-b border-black/[0.06]">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="section-label">Applicants</p>
            <h2 className="text-section text-foreground mb-4">Who Should Apply?</h2>
            <p className="text-sm text-muted-foreground">
              Fusion 8 is for builders — not just students with degrees. If you are willing to show up and do the work, we want you.
            </p>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {WHO_SHOULD_APPLY.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={i} variants={fadeUp}
                  className="bg-card border border-black/[0.06] hover:border-accent/20 rounded-2xl p-6 space-y-4 transition-all group">
                  <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-foreground mb-2">{item.title}</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                  </div>
                  <div className="flex items-start gap-2 pt-2 border-t border-black/[0.05]">
                    <Check className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                    <p className="text-[10px] font-semibold text-muted-foreground leading-relaxed">{item.check}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
          <div className="text-center mt-10">
            <Button asChild className="bg-accent hover:bg-orange-600 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-accent/20">
              <Link href="/apply">Apply for Cohort 01 <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
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

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }} className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {COURSES.map((course, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Link href={course.href} className="group flex flex-col h-full bg-card border border-black/[0.06] rounded-2xl overflow-hidden hover:border-accent/25 transition-all hover:shadow-lg">
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
                    <p className="text-xs leading-relaxed mb-6 flex-1 text-muted-foreground">{course.desc}</p>
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

      {/* ═══════════════ WHAT STUDENTS BUILD ═══════════════ */}
      <section className="bg-background border-b border-black/[0.06]">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="text-center mb-14">
            <p className="section-label">Student Projects</p>
            <h2 className="text-section text-foreground mb-4">What You&apos;ll Build.</h2>
            <p className="text-sm max-w-xl mx-auto text-muted-foreground">
              Every student leaves with a working prototype. Here are the kinds of projects that come out of the Fusion 8 lab.
            </p>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }}
            className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PROJECTS.map((p, i) => (
              <motion.div key={i} variants={fadeUp}
                className="group bg-card border border-black/[0.06] rounded-2xl overflow-hidden hover:border-accent/20 transition-all hover:shadow-lg">
                <div className="relative h-48 overflow-hidden">
                  <Image src={p.image} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="text-sm font-black text-foreground">{p.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{p.desc}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {p.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-black uppercase tracking-widest bg-accent/10 text-accent px-2.5 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ THE PIPELINE — 6 STAGES ═══════════════ */}
      <section className="bg-[#F3F4F6] border-b border-black/[0.06]">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="text-center mb-14">
            <p className="section-label">The Founder Journey</p>
            <h2 className="text-section text-foreground mb-4">From Student to Founder. 6 Stages.</h2>
            <p className="text-sm max-w-xl mx-auto text-muted-foreground">
              Every graduate starts at Stage 01. The pipeline does the rest.
            </p>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {PIPELINE.map((p, i) => (
              <motion.div key={p.n} variants={fadeUp}
                className={`relative bg-card border rounded-2xl p-6 hover:border-accent/25 transition-all group ${i === 0 ? 'border-accent/25 bg-accent/[0.04]' : 'border-black/[0.06]'}`}
              >
                <div className="text-5xl font-black font-mono mb-3 leading-none" style={{ color: i === 0 ? 'rgba(228,77,40,0.35)' : 'rgba(100,116,139,0.15)' }}>{p.n}</div>
                <h3 className={`text-sm font-black mb-1.5 ${i === 0 ? 'text-accent' : 'text-foreground'}`}>{p.t}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{p.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ FUTURE TRACKS ═══════════════ */}
      <section className="bg-background border-b border-black/[0.06]">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="text-center mb-14">
            <p className="section-label">Future Courses</p>
            <h2 className="text-section text-foreground mb-4">This Is Just the Beginning.</h2>
            <p className="text-sm max-w-xl mx-auto text-muted-foreground">Fusion 8 will expand into 14 industry tracks by 2030.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
            {TRACKS.map(({ icon: Icon, label, status }) => (
              <div key={label} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${status === 'now' ? 'border-accent/25 bg-accent/[0.07]' : 'bg-card border-black/[0.06]'}`}>
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

      {/* ═══════════════ WHATSAPP COMMUNITY ═══════════════ */}
      <section className="bg-[#F3F4F6] border-b border-black/[0.06]">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="relative rounded-2xl overflow-hidden aspect-video border border-black/[0.06]">
                <Image src={IMAGES.teamWorking} alt="Fusion 8 community" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2">
                    <Users className="h-4 w-4 text-white" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">Growing Community</span>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="section-label">Community</p>
                  <h2 className="text-section text-foreground mb-4">Join the Conversation.</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Connect with fellow builders, get early access to program updates, ask questions before applying, and be part of the Fusion 8 community before Cohort 01 even begins.
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    'Get program announcements first',
                    'Ask questions directly to the team',
                    'Connect with future cohort mates',
                    'Share project ideas and get feedback',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#25D366]/15 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-[#25D366]" />
                      </div>
                      <p className="text-sm text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
                <a
                  href="https://chat.whatsapp.com/LflIGcSgE0AKgGlBmL01fD"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold h-12 px-7 rounded-xl shadow-lg transition-all hover:shadow-xl"
                >
                  <MessageCircle className="h-5 w-5" />
                  Join WhatsApp Community
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="bg-background border-b border-black/[0.06]">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-14">
              <p className="section-label">Questions</p>
              <h2 className="text-section text-foreground mb-4">Frequently Asked.</h2>
              <p className="text-sm text-muted-foreground">
                Still have questions? Message us on{' '}
                <a href="https://chat.whatsapp.com/LflIGcSgE0AKgGlBmL01fD" target="_blank" rel="noopener noreferrer"
                  className="text-accent font-semibold hover:underline">WhatsApp</a> or email{' '}
                <a href="mailto:fusion8.cohort01@gmail.com" className="text-accent font-semibold hover:underline">fusion8.cohort01@gmail.com</a>.
              </p>
            </div>
            <Accordion type="single" collapsible className="space-y-3">
              {FAQS.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="bg-card border border-black/[0.06] rounded-2xl px-6 overflow-hidden data-[state=open]:border-accent/20"
                >
                  <AccordionTrigger className="text-sm font-bold text-left py-5 hover:no-underline hover:text-accent transition-colors">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#0A0E10] hover:bg-black text-white font-bold h-12 px-7 rounded-xl shadow-2xl shadow-black/40 transition-all">
              <Link href="/apply">Apply Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <a
              href="https://chat.whatsapp.com/LflIGcSgE0AKgGlBmL01fD"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-all"
            >
              <MessageCircle className="h-4 w-4" /> Ask a Question
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
