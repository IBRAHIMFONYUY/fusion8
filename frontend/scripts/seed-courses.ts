/**
 * Seed script — run once to populate Firestore with sample courses.
 * Usage:  npx ts-node --project tsconfig.json scripts/seed-courses.ts
 *
 * Requires FIREBASE_ADMIN_* vars set in .env (or hardcoded below for local dev).
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const serviceAccount = {
  projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID   || '',
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '',
  privateKey:  (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount as any) });
}
const db = getFirestore();

const COURSES = [
  {
    id: 'course-solidworks-001',
    title: 'SolidWorks for Engineers',
    description: 'Master 3D CAD design for mechanical and product engineering. Design parts, assemblies, and technical drawings used in real industry projects.',
    longDescription: 'This course covers the full SolidWorks workflow from sketch to final assembly drawing — the same process used in Cameroon\'s growing manufacturing and automotive sectors.',
    category: 'SolidWorks',
    level: 'Beginner',
    price: 5000,
    status: 'published',
    enrolledCount: 12,
    thumbnail: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80',
    teacherId: 'admin',
    teacherName: 'Fusion 8 Team',
    createdAt: new Date(),
  },
  {
    id: 'course-embedded-001',
    title: 'Embedded Systems with Arduino',
    description: 'Build real embedded hardware from scratch. Program microcontrollers, interface sensors, and deploy IoT-ready firmware on Arduino and ESP32 boards.',
    longDescription: 'Covers C++ for embedded systems, GPIO control, I2C/SPI communication, interrupt-driven design, and final capstone IoT project.',
    category: 'Embedded Systems',
    level: 'Beginner',
    price: 5000,
    status: 'published',
    enrolledCount: 28,
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    teacherId: 'admin',
    teacherName: 'Fusion 8 Team',
    createdAt: new Date(),
  },
  {
    id: 'course-automotive-001',
    title: 'Automotive Electronics & OBD Systems',
    description: 'Understand vehicle electronic control units, CAN bus communication, OBD-II diagnostics, and automotive sensor networks.',
    longDescription: 'Practical course covering vehicle diagnostics using real hardware scanners, ECU programming concepts, and the automotive electronics standards used in modern vehicles.',
    category: 'Automotive',
    level: 'Intermediate',
    price: 7500,
    status: 'published',
    enrolledCount: 8,
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    teacherId: 'admin',
    teacherName: 'Fusion 8 Team',
    createdAt: new Date(),
  },
  {
    id: 'course-matlab-001',
    title: 'MATLAB for Engineering Simulation',
    description: 'Apply MATLAB to solve real engineering problems: signal processing, control systems design, simulation, and data analysis.',
    longDescription: 'From basic scripting to Simulink models — this course gives engineers the computational tools to design, test, and validate systems before building hardware.',
    category: 'MATLAB',
    level: 'Intermediate',
    price: 6000,
    status: 'published',
    enrolledCount: 15,
    thumbnail: 'https://images.unsplash.com/photo-1507146153-c8ff600f1c83?auto=format&fit=crop&w=800&q=80',
    teacherId: 'admin',
    teacherName: 'Fusion 8 Team',
    createdAt: new Date(),
  },
  {
    id: 'course-drone-001',
    title: 'Drone & UAV Piloting + Design',
    description: 'Learn to pilot, configure, and build drones. Covers flight dynamics, FPV systems, mission planning, and UAV regulations in Cameroon.',
    longDescription: 'Combines practical piloting skills with hardware build: frame assembly, ESC/motor calibration, flight controller setup, and autonomous mission scripting.',
    category: 'Drones & UAV',
    level: 'Intermediate',
    price: 8000,
    status: 'published',
    enrolledCount: 19,
    thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    teacherId: 'admin',
    teacherName: 'Fusion 8 Team',
    createdAt: new Date(),
  },
  {
    id: 'course-mechatronics-001',
    title: 'Mechatronics & Robotics Fundamentals',
    description: 'Integrate mechanical, electrical, and software systems to build intelligent machines. Project-based learning with a working robot arm capstone.',
    longDescription: 'Covers actuator selection, power electronics, PID control, mechanical design principles, and full-system integration — building toward a working robotic arm final project.',
    category: 'Mechatronics',
    level: 'Advanced',
    price: 10000,
    status: 'published',
    enrolledCount: 11,
    thumbnail: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    teacherId: 'admin',
    teacherName: 'Fusion 8 Team',
    createdAt: new Date(),
  },
];

async function seed() {
  console.log('🌱 Seeding Fusion 8 courses...\n');
  for (const course of COURSES) {
    const { id, ...data } = course;
    await db.collection('courses').doc(id).set(data, { merge: true });
    console.log(`  ✅  ${course.title}`);
  }
  console.log('\n✔ Seed complete — 6 published courses added to Firestore.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
