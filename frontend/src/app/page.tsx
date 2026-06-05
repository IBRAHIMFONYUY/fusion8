'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { ParticleCanvas } from '@/components/ui/particle-canvas';
import { TiltCard } from '@/components/ui/tilt-card';
import { CircuitSVG, ChipSVG, ArduinoSVG } from '@/components/ui/circuit-svg';
import { IMAGES } from '@/lib/images';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence, type Variants } from 'framer-motion';
import {
  ArrowRight, ChevronRight, Zap, Rocket, FlaskConical,
  GraduationCap, Building2, Cpu, Leaf, Heart, Factory,
  Globe, Truck, Droplets, BookOpen, Bot, Brain, Check,
  Wifi, Layers, Code2
} from 'lucide-react';

/* ── Data ─────────────────────────────────────────────────────────────────── */
const HEADLINES = [
  { line1: "Africa Doesn't Have an Idea Problem.", line2: "It Has an Execution Problem." },
  { line1: "Great Ideas Don't Change the World.", line2: "Built Products Do." },
  { line1: "Building Africa's Next", line2: "Generation of Innovators." },
];

const TEAM = [
  { initials: 'FD', name: 'Founder', role: 'Program Director & Lead Trainer', division: 'Training' },
  { initials: 'MG', name: 'Moh Gracious', role: 'Hardware & Robotics Trainer', division: 'Training' },
  { initials: 'ST', name: 'Soh Talla Erick', role: 'Marketing Strategy & LinkedIn', division: 'Marketing' },
  { initials: 'FR', name: 'Fouen Romual', role: 'Social Media & Videographer', division: 'Marketing' },
  { initials: 'TJ', name: 'Teke Jeol', role: 'Community & WhatsApp Lead', division: 'Marketing' },
  { initials: 'DF', name: 'Divine Favour', role: 'Brand Design Lead', division: 'Marketing' },
  { initials: 'KB', name: 'Kakwang Brain', role: 'Brand Design Co-Lead', division: 'Marketing' },
  { initials: 'KC', name: 'Komofor Calvin', role: 'Ground Outreach Lead', division: 'Operations' },
  { initials: 'PD', name: 'Precious Djou', role: 'Admin & Documentation', division: 'Operations' },
];

const STATS = [
  { value: 9,  suffix: '%',  label: 'African youth in technical programs',  source: 'UNESCO 2024' },
  { value: 90, suffix: 'B+', label: 'Annual infrastructure gap (USD)',       source: 'OECD 2025' },
  { value: 57, suffix: '%',  label: 'Cameroon workforce aged 18–35',         source: 'NIS 2024' },
  { value: 60, suffix: '%',  label: 'African unemployed who are youth',       source: 'UNESCO/AIMS' },
];

const ECOSYSTEM = [
  { num: '01', title: 'Fusion 8 Academy',     desc: 'Hands-on engineering training. Hardware, IoT, Robotics, AI-ready skills.', badge: 'Open Now',    icon: GraduationCap, open: true },
  { num: '02', title: 'Innovation Incubator', desc: 'Transform your idea into a validated, working prototype with mentorship.',  badge: 'Coming 2027', icon: FlaskConical,  open: false },
  { num: '03', title: 'Product Accelerator',  desc: 'From MVP to market-ready. Commercialization, manufacturing, funding.',     badge: 'Coming 2027', icon: Rocket,        open: false },
  { num: '04', title: 'Engineering Labs',     desc: 'Physical lab with hardware kits, PCB fabrication, and test benches.',      badge: 'Coming 2027', icon: Cpu,           open: false },
  { num: '05', title: 'Venture Studio',       desc: 'Startups co-built from scratch with Fusion 8 as founding partner.',        badge: 'Coming 2029', icon: Building2,     open: false },
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

const PIPELINE = ['Idea', 'Discovery', 'Validation', 'Prototype', 'Incubation', 'Acceleration', 'Product', 'Market', 'Scaling'];

const VALUES = [
  'Build Before You Talk', 'Execution Over Excuses', 'Solve Real Problems',
  'Learn. Build. Accelerate.', 'Collaboration Over Competition',
  'Think Globally. Build For Africa.', 'Excellence Through Discipline.',
];

/* ── Animated counter ─────────────────────────────────────────────────────── */
function Counter({ target, suffix, active }: { target: number; suffix: string; active: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    const steps = 60; const inc = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + inc, target);
      setN(Math.floor(cur));
      if (cur >= target) clearInterval(t);
    }, 1600 / steps);
    return () => clearInterval(t);
  }, [target, active]);
  return <>{n}{suffix}</>;
}

/* ── Floating tech badge ───────────────────────────────────────────────────── */
function FloatingBadge({ label, Icon, delay = 0, x = 0, y = 0 }: { label: string; Icon: any; delay?: number; x?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{ opacity: { delay, duration: 0.5 }, scale: { delay, duration: 0.5 }, y: { delay, duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
      className="absolute flex items-center gap-2 bg-card/90 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 shadow-xl shadow-black/30"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="w-6 h-6 bg-accent/20 rounded-lg flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-accent" />
      </div>
      <span className="text-[11px] font-bold text-foreground whitespace-nowrap">{label}</span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [hIdx, setHIdx] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-100px' });
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const t = setInterval(() => setHIdx(i => (i + 1) % HEADLINES.length), 4500);
    return () => clearInterval(t);
  }, []);

  const h = HEADLINES[hIdx];

  /* ── Reusable section variants ── */
  const fadeUp: Variants = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.7 } } };
  const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      <Header />

      {/* ════════════════════════ HERO ════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Particle background */}
        <div className="absolute inset-0">
          <ParticleCanvas className="opacity-70" />
        </div>

        {/* Grid texture */}
        <div className="absolute inset-0 grid-texture opacity-60" />

        {/* Radial glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(228,77,40,0.08) 0%, transparent 65%)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(228,77,40,0.05) 0%, transparent 65%)' }} />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container mx-auto px-4 relative z-10 pt-24 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: text */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-accent">Now Enrolling — Cohort 01 · 2026</span>
              </motion.div>

              <div className="min-h-[8rem] flex flex-col justify-center mb-8">
                <AnimatePresence mode="wait">
                  <motion.div key={hIdx}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <h1 className="font-black text-foreground leading-none mb-2" style={{ fontSize: 'clamp(2rem,5vw,4.5rem)', letterSpacing: '-0.05em' }}>
                      {h.line1}
                    </h1>
                    <h1 className="font-black text-accent leading-none" style={{ fontSize: 'clamp(2rem,5vw,4.5rem)', letterSpacing: '-0.05em' }}>
                      {h.line2}
                    </h1>
                  </motion.div>
                </AnimatePresence>
              </div>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}
                className="text-base md:text-lg max-w-lg mb-10 leading-relaxed" style={{ color: 'rgba(246,245,242,0.58)' }}>
                Building the talent, systems, and infrastructure required to turn African innovation into global impact. Starting in Bamenda, Cameroon.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button asChild size="lg" className="bg-accent hover:bg-orange-600 text-white font-black h-14 px-9 text-base rounded-xl shadow-2xl shadow-accent/30 hover:shadow-accent/50 hover:scale-[1.03] transition-all">
                  <Link href="/apply">Apply for Cohort 01 <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 text-foreground hover:bg-white/5 hover:border-white/30 h-14 px-9 text-base rounded-xl font-semibold backdrop-blur-sm">
                  <Link href="/about">Explore the Ecosystem</Link>
                </Button>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.5 }}
                className="flex flex-wrap gap-10">
                {[{ n: '30', l: 'Students' }, { n: '7', l: 'Weeks' }, { n: '2×', l: 'Sessions/Week' }, { n: '1', l: 'Demo Day' }].map((s, i) => (
                  <motion.div key={s.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 + i * 0.1 }} className="text-center">
                    <div className="text-2xl font-black text-accent">{s.n}</div>
                    <div className="text-[10px] uppercase tracking-[0.18em] font-semibold mt-0.5" style={{ color: 'rgba(246,245,242,0.40)' }}>{s.l}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right: real photo + floating overlays */}
            <div className="hidden lg:flex items-center justify-center relative h-[520px]">
              <motion.div
                initial={{ opacity: 0, scale: 0.92, x: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 1 }}
                className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl shadow-black/60"
              >
                <Image src={IMAGES.heroLab} alt="Engineering student working in a hardware lab" fill className="object-cover" priority />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,14,16,0.6) 0%, rgba(10,14,16,0.15) 50%, rgba(228,77,40,0.08) 100%)' }} />
                <div className="absolute inset-0 opacity-15 pointer-events-none">
                  <CircuitSVG className="w-full h-full" />
                </div>
                {/* F8 badge */}
                <motion.div
                  animate={{ boxShadow: ['0 0 20px rgba(228,77,40,0.4)', '0 0 45px rgba(228,77,40,0.7)', '0 0 20px rgba(228,77,40,0.4)'] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute top-6 left-6 w-14 h-14 bg-accent rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-xl z-10"
                >F8</motion.div>
                {/* Stats bar */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
                  className="absolute bottom-6 left-6 right-6 bg-black/65 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex justify-around z-10">
                  {[{ n: '30', l: 'Students' }, { n: '7', l: 'Weeks' }, { n: '5h', l: 'Per Session' }, { n: '1', l: 'Demo Day' }].map(s => (
                    <div key={s.l} className="text-center">
                      <div className="text-xl font-black text-accent">{s.n}</div>
                      <div className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: 'rgba(246,245,242,0.55)' }}>{s.l}</div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
              {/* Floating badges */}
              <FloatingBadge label="Arduino UNO" Icon={Cpu}  delay={1.0} x={-16} y={12} />
              <FloatingBadge label="IoT Enabled" Icon={Wifi} delay={1.3} x={74}  y={6}  />
              <FloatingBadge label="AI-Ready"    Icon={Brain}delay={1.6} x={74}  y={76} />
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-accent" />
          <div className="w-1 h-1 rounded-full bg-accent" />
        </motion.div>
      </section>

      {/* ════════════════════════ PROBLEM ════════════════════════ */}
      <section className="bg-[#F6F5F2] text-[#0A0E10] overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut" }}>
              {/* Real photo — African engineering student */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.8 }}
                className="relative rounded-2xl overflow-hidden mb-7 shadow-xl" style={{ height: 240 }}>
                <Image src={IMAGES.studentLaptop} alt="African engineering student" fill className="object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(246,245,242,0.9) 0%, transparent 60%)' }} />
                <div className="absolute bottom-4 left-4 right-4">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="font-black leading-none"
                    style={{ fontSize: 'clamp(4rem,10vw,7rem)', color: '#E44D28', textShadow: '0 2px 20px rgba(228,77,40,0.3)' }}
                  >
                    90<span style={{ fontSize: '40%' }}>%</span>
                  </motion.div>
                </div>
              </motion.div>
              <p className="text-xl md:text-2xl font-bold leading-snug text-[#0A0E10]">
                of Cameroon's workforce operates in the informal sector.
              </p>
              <p className="text-sm mt-3" style={{ color: 'rgba(10,14,16,0.50)' }}>World Bank, 2023 · NIS, 2024</p>
            </motion.div>

            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-6">
              {[
                { t: 'Built, Graded, Forgotten', d: 'Final year engineering projects are submitted, graded once, and abandoned. No products. No impact. The work disappears.' },
                { t: "Skills That Don't Transfer", d: 'Brilliant graduates cannot wire a motor driver, write embedded firmware, or prototype a sensor array. The gap is brutal.' },
                { t: 'Ideas That Never Launch', d: 'Competition winners get trophies. Their ideas never become products. The gap between concept and market stays wide open.' },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} className="pl-5 border-l-[3px]" style={{ borderLeftColor: '#E44D28' }}>
                  <h3 className="font-black text-[#0A0E10] mb-1.5">{item.t}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(10,14,16,0.60)' }}>{item.d}</p>
                </motion.div>
              ))}
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-[#E44D28] text-white px-5 py-3 rounded-xl font-black text-sm mt-2">
                Fusion 8 is changing this. <ChevronRight className="h-4 w-4" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════ ARCHITECTURE ════════════════════════ */}
      <section className="bg-background grid-texture relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">The Architecture</p>
            <h2 className="text-section text-foreground mb-4">Not a Training Center.<br />An Innovation Ecosystem.</h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'rgba(246,245,242,0.52)' }}>Three layers. One complete pipeline from student to industry impact.</p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid md:grid-cols-3 gap-5 mb-16">
            {[
              { n: '01', t: 'Education Layer', sub: 'Talent · Skills · Builders', d: 'Hands-on hardware training. Real circuits, real sensors, real systems. No theory without application.' },
              { n: '02', t: 'Innovation Layer', sub: 'Projects · Prototypes · Research', d: 'Students identify real African problems and build working solutions. Prototype. Test. Validate.' },
              { n: '03', t: 'Acceleration Layer', sub: 'Commercialization · Startups · Impact', d: 'From prototype to market. Manufacturing pathway. Investor readiness. Company formation.' },
            ].map((l, i) => (
              <motion.div key={l.n} variants={fadeUp}>
                <TiltCard className="bg-card border border-white/[0.07] hover:border-accent/25 rounded-2xl p-7 cursor-default h-full">
                  <div className="text-6xl font-black font-mono mb-4" style={{ color: 'rgba(228,77,40,0.18)' }}>{l.n}</div>
                  <h3 className="text-base font-black text-foreground mb-1">{l.t}</h3>
                  <p className="text-xs text-accent uppercase tracking-wider font-bold mb-3">{l.sub}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(246,245,242,0.52)' }}>{l.d}</p>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>

          {/* Animated pipeline */}
          <div className="overflow-x-auto pb-2">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1 }}
              className="flex items-center gap-0 w-fit mx-auto">
              {PIPELINE.map((s, i) => (
                <div key={s} className="flex items-center">
                  <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
                    className="flex flex-col items-center">
                    <motion.div animate={{ boxShadow: ['0 0 4px rgba(228,77,40,0.4)', '0 0 12px rgba(228,77,40,0.8)', '0 0 4px rgba(228,77,40,0.4)'] }}
                      transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                      className="w-2.5 h-2.5 rounded-full bg-accent"
                    />
                    <span className="text-[9px] font-black uppercase tracking-wider mt-2 whitespace-nowrap" style={{ color: i === 0 ? 'rgba(228,77,40,1)' : 'rgba(246,245,242,0.38)' }}>{s}</span>
                  </motion.div>
                  {i < PIPELINE.length - 1 && (
                    <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 + 0.3, duration: 0.4 }}
                      className="w-6 md:w-10 h-px mx-0.5 origin-left"
                      style={{ background: 'linear-gradient(to right, rgba(228,77,40,0.7), rgba(228,77,40,0.15))' }}
                    />
                  )}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════ COHORT 01 ════════════════════════ */}
      <section className="bg-[#070A0C] border-y border-white/[0.06] relative overflow-hidden">
        {/* Background lab photo */}
        <div className="absolute inset-0 pointer-events-none">
          <Image src={IMAGES.labWorkshop} alt="" fill className="object-cover opacity-[0.06]" />
          <div className="absolute inset-0 bg-[#070A0C]/80" />
        </div>
        <div className="absolute right-0 top-0 w-96 h-full opacity-[0.03] pointer-events-none">
          <CircuitSVG className="w-full h-full object-cover" />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut" }}>
              <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/25 rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-accent">Now Enrolling</span>
              </div>
              <h2 className="text-section text-foreground mb-1">Hardware &amp; IoT Bootcamp</h2>
              <p className="text-accent font-bold mb-6">Cohort 01 · 2026</p>

              <motion.ul variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-3 mb-8">
                {['7 Weeks — 5 training + 2 build sprint', '2 sessions/week · 5 hours each', 'Arduino · Sensors · Robotics · IoT · Design Thinking', '30 students max — applied cohort model', 'Complete beginners welcome', 'Demo Day at week 7 — real engineers & investors', 'Certificate + Innovation Readiness Grade'].map((item, i) => (
                  <motion.li key={i} variants={fadeUp} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(246,245,242,0.72)' }}>
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />{item}
                  </motion.li>
                ))}
              </motion.ul>

              <TiltCard className="bg-card border border-white/[0.08] rounded-xl p-5 mb-7 cursor-default">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Program Fee</p>
                <p className="text-3xl font-black text-foreground">5,000 <span className="text-sm font-semibold" style={{ color: 'rgba(246,245,242,0.50)' }}>XAF</span></p>
                <p className="text-xs mt-1" style={{ color: 'rgba(246,245,242,0.42)' }}>MTN MoMo · 680 149 883 · Jones Yondo</p>
              </TiltCard>

              <div className="flex flex-col sm:flex-row gap-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button asChild size="lg" className="bg-accent hover:bg-orange-600 text-white font-black shadow-lg shadow-accent/25 rounded-xl">
                    <Link href="/apply">Apply Now — 30 Spots <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </motion.div>
                <Button asChild size="lg" variant="outline" className="border-white/20 text-foreground hover:bg-white/5 rounded-xl">
                  <a href="https://chat.whatsapp.com/LflIGcSgE0AKgGlBmL01fD" target="_blank" rel="noopener noreferrer">Join WhatsApp</a>
                </Button>
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] mb-4" style={{ color: 'rgba(246,245,242,0.38)' }}>Program Timeline</p>
              {[
                { w: 'Week 1', t: 'Orientation & Foundations', d: 'Electronics basics · Lab setup · Team formation', hl: false },
                { w: 'Weeks 2–3', t: 'Arduino & Hardware Systems', d: 'Microcontrollers · Sensors · Actuators · Circuit design', hl: false },
                { w: 'Weeks 4–5', t: 'IoT & Connectivity', d: 'Wi-Fi · MQTT · Cloud dashboards · Real-time data', hl: false },
                { w: 'Week 6', t: 'Design Thinking & Prototyping', d: 'Problem framing · User validation · MVP design', hl: false },
                { w: 'Week 7', t: '🔥 DEMO DAY', d: 'Present your project · Readiness Grade · Certification', hl: true },
              ].map((w, i) => (
                <motion.div key={w.w} variants={fadeUp}
                  className={`flex gap-4 p-4 rounded-xl border transition-all ${w.hl ? 'bg-accent/10 border-accent/30' : 'bg-card/40 border-white/[0.06]'}`}
                  whileHover={{ x: 4 }}
                >
                  <div className={`shrink-0 text-[10px] font-black uppercase tracking-wider pt-0.5 w-[72px] ${w.hl ? 'text-accent' : 'text-accent/60'}`}>{w.w}</div>
                  <div>
                    <p className={`text-sm font-black mb-0.5 ${w.hl ? 'text-accent' : 'text-foreground'}`}>{w.t}</p>
                    <p className="text-xs" style={{ color: 'rgba(246,245,242,0.45)' }}>{w.d}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════ STATS ════════════════════════ */}
      <div ref={statsRef}>
        <section className="bg-background border-y border-white/[0.06]">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-3">The Data Is Damning</p>
              <h2 className="text-section text-foreground">Why This Work Can't Wait.</h2>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.06]">
              {STATS.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center p-6 md:p-8">
                  <motion.div animate={statsInView ? { scale: [0.8, 1.05, 1] } : {}} transition={{ delay: i * 0.15, duration: 0.6 }}
                    className="text-5xl md:text-6xl font-black text-accent mb-2 tabular-nums">
                    <Counter target={s.value} suffix={s.suffix} active={statsInView} />
                  </motion.div>
                  <p className="text-sm font-semibold text-foreground mb-1">{s.label}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(246,245,242,0.38)' }}>— {s.source}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ════════════════════════ ECOSYSTEM ════════════════════════ */}
      <section className="bg-[#070A0C]">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">The Ecosystem</p>
            <h2 className="text-section text-foreground mb-4">One Ecosystem. Five Pathways.</h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'rgba(246,245,242,0.48)' }}>Every pathway connects. Every stage builds on the last.</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ECOSYSTEM.map(item => {
              const Icon = item.icon;
              return (
                <motion.div key={item.num} variants={fadeUp}>
                  <TiltCard className={`relative bg-card border rounded-2xl p-7 cursor-default h-full ${item.open ? 'border-accent/20' : 'border-white/[0.07]'}`}>
                    <div className={`absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${item.open ? 'bg-accent text-white' : 'bg-white/[0.06]'}`}
                      style={{ color: item.open ? undefined : 'rgba(246,245,242,0.38)' }}>
                      {item.badge}
                    </div>
                    <motion.div whileHover={{ scale: 1.1 }} className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center mb-5">
                      <Icon className="h-5 w-5 text-accent" />
                    </motion.div>
                    <div className="text-4xl font-black font-mono absolute bottom-5 right-5" style={{ color: 'rgba(228,77,40,0.12)' }}>{item.num}</div>
                    <h3 className="text-base font-black text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(246,245,242,0.48)' }}>{item.desc}</p>
                  </TiltCard>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════ TRACKS ════════════════════════ */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">14 Industry Tracks</p>
            <h2 className="text-section text-foreground mb-4">Not Just About Arduino.</h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: 'rgba(246,245,242,0.48)' }}>We build intelligent solutions across every sector Africa needs to industrialize.</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {TRACKS.map(({ icon: Icon, label, status }, i) => (
              <motion.div key={label} variants={fadeUp}
                whileHover={{ y: -3, borderColor: status === 'now' ? 'rgba(228,77,40,0.5)' : 'rgba(246,245,242,0.15)' }}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-default ${status === 'now' ? 'border-accent/25' : 'bg-card border-white/[0.06]'}`}
                style={{ background: status === 'now' ? 'rgba(228,77,40,0.07)' : undefined }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${status === 'now' ? 'bg-accent/15' : 'bg-white/[0.05]'}`}>
                  <Icon className={`h-4 w-4 ${status === 'now' ? 'text-accent' : 'text-foreground/35'}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold leading-tight" style={{ color: status === 'now' ? 'rgba(246,245,242,0.90)' : 'rgba(246,245,242,0.52)' }}>{label}</p>
                  <p className="text-[9px] font-black uppercase tracking-wider mt-0.5" style={{ color: status === 'now' ? 'rgba(228,77,40,0.9)' : 'rgba(246,245,242,0.28)' }}>
                    {status === 'now' ? 'Available Now' : 'Coming Soon'}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════ TEAM ════════════════════════ */}
      <section className="bg-[#070A0C] border-y border-white/[0.06]">
        <div className="container mx-auto px-4 py-20 md:py-24">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">The Command Center</p>
            <h2 className="text-section text-foreground">9 People. One Mission.</h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {TEAM.map(m => (
              <motion.div key={m.initials} variants={fadeUp} whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                className="bg-card border border-white/[0.07] hover:border-accent/20 rounded-2xl p-5 transition-all text-center cursor-default">
                <motion.div whileHover={{ scale: 1.1 }} className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-sm font-black ${m.division === 'Training' ? 'bg-accent/15 text-accent' : m.division === 'Marketing' ? 'bg-white/10 text-foreground/80' : 'bg-white/[0.05] text-foreground/45'}`}>
                  {m.initials}
                </motion.div>
                <p className="text-sm font-black text-foreground leading-tight mb-0.5">{m.name}</p>
                <p className="text-[10px] leading-snug" style={{ color: 'rgba(246,245,242,0.42)' }}>{m.role}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════ VISION 2032 ════════════════════════ */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-20 md:py-24">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent mb-4">Vision 2032</p>
            <h2 className="text-section text-foreground mb-6 max-w-3xl mx-auto leading-snug">
              "By 2032, Fusion 8 will be Africa's leading hardtech product acceleration ecosystem."
            </h2>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="flex flex-wrap justify-center gap-0 mb-16">
            {[{ y: '2026', l: 'Academy' }, { y: '2027', l: 'Labs + Incubator' }, { y: '2028', l: 'Accelerator' }, { y: '2030', l: 'Venture Studio' }, { y: '2032', l: 'Pan-African' }].map((s, i) => (
              <div key={s.y} className="flex items-center">
                <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15, type: 'spring', stiffness: 300 }}
                  className="flex flex-col items-center px-3 md:px-5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs border-2 ${i === 0 ? 'bg-accent border-accent text-white' : 'border-white/15 text-foreground/40'}`}>{s.y.slice(2)}</div>
                  <p className="text-[9px] font-black uppercase tracking-wider mt-2 text-center w-20 leading-tight" style={{ color: i === 0 ? 'rgba(228,77,40,1)' : 'rgba(246,245,242,0.32)' }}>{s.l}</p>
                </motion.div>
                {i < 4 && <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15 + 0.3, duration: 0.5 }}
                  className="w-6 md:w-12 h-px origin-left"
                  style={{ background: 'linear-gradient(to right, rgba(228,77,40,0.4), rgba(246,245,242,0.08))' }} />}
              </div>
            ))}
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex flex-wrap justify-center gap-2.5">
            {VALUES.map((v, i) => (
              <motion.span key={v} variants={fadeUp} whileHover={{ borderColor: 'rgba(228,77,40,0.4)', color: 'rgba(246,245,242,0.70)' }}
                className="text-[10px] font-bold uppercase tracking-wider px-4 py-2 border border-white/[0.10] rounded-full cursor-default transition-colors"
                style={{ color: 'rgba(246,245,242,0.40)' }}>
                {v}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════ FINAL CTA ════════════════════════ */}
      <section className="bg-accent relative overflow-hidden">
        <div className="absolute inset-0 grid-texture opacity-[0.07]" />
        {/* Animated glow orbs */}
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 5, repeat: Infinity }}
          className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 py-20 md:py-24 text-center relative z-10">
          <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="font-black text-white mb-4 leading-tight" style={{ fontSize: 'clamp(2rem,6vw,4.5rem)', letterSpacing: '-0.04em' }}>
            Your Spot in the Build<br />Starts Now.
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-white/80 mb-2">
            Only 30 spots in Cohort 01. 5,000 XAF. 7 weeks. Bamenda.
          </motion.p>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="text-sm text-white/55 mb-10">
            The engineers who will build Africa's future are deciding right now.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button asChild size="lg" className="bg-[#0A0E10] hover:bg-black text-white font-black h-14 px-10 text-base rounded-xl shadow-2xl shadow-black/50">
                <Link href="/apply">Apply Now →</Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 h-14 px-10 text-base rounded-xl font-bold">
                <a href="https://chat.whatsapp.com/LflIGcSgE0AKgGlBmL01fD" target="_blank" rel="noopener noreferrer">Join WhatsApp Community</a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
