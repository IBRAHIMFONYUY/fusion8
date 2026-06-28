/**
 * Certificate Generation Service
 *
 * Generates a branded PDF completion certificate for Fusion8 courses.
 * Runs entirely client-side using jsPDF — no server round-trip needed.
 *
 * The certificate is also saved to Firestore so it can be retrieved and
 * verified by employers / institutions using the certificate ID.
 */

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/firebase';

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  completionDate: Date;
  studentId: string;
  courseId: string;
  instructorName?: string;
  track?: string;
}

export interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  studentName: string;
  courseTitle: string;
  issuedAt: any;
  verificationUrl: string;
  pdfUrl?: string;
}

// Brand colours (from design spec)
const BRAND = {
  orange: '#E8461E',
  black: '#0A0A0A',
  white: '#FAFAFA',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
};

function generateCertificateId(studentId: string, courseId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const hash = btoa(`${studentId}:${courseId}`)
    .replace(/[^A-Z0-9]/gi, '')
    .substring(0, 8)
    .toUpperCase();
  return `F8-${hash}-${timestamp}`;
}

/**
 * Generates a PDF certificate and returns the PDF as a Blob.
 * Uses jsPDF loaded dynamically to keep the main bundle lean.
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Blob> {
  // Dynamic import keeps jsPDF out of the initial page bundle
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const W = 297;
  const H = 210;

  // ── Background ────────────────────────────────────────────────────────────
  doc.setFillColor(BRAND.black);
  doc.rect(0, 0, W, H, 'F');

  // Top accent bar
  doc.setFillColor(BRAND.orange);
  doc.rect(0, 0, W, 8, 'F');

  // Bottom accent bar
  doc.rect(0, H - 8, W, 8, 'F');

  // Left sidebar
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 8, 45, H - 16, 'F');

  // ── Left sidebar text ─────────────────────────────────────────────────────
  doc.setTextColor(BRAND.orange);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  // Rotated "FUSION8" label
  doc.text('F U S I O N 8', 22, H / 2, { angle: 90, align: 'center' });

  // ── Main content area ─────────────────────────────────────────────────────
  const contentX = 55;
  const contentW = W - contentX - 15;

  // "Certificate of Completion" label
  doc.setFillColor(BRAND.orange);
  doc.setDrawColor(BRAND.orange);
  doc.roundedRect(contentX, 22, 80, 8, 1, 1, 'F');
  doc.setTextColor(BRAND.white);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE OF COMPLETION', contentX + 40, 27.5, { align: 'center' });

  // Title
  doc.setTextColor(BRAND.white);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('BUILD. DON\'T', contentX, 52);

  doc.setTextColor(BRAND.orange);
  doc.text('JUST LEARN.', contentX, 68);

  // Divider
  doc.setDrawColor(BRAND.orange);
  doc.setLineWidth(0.5);
  doc.line(contentX, 74, contentX + contentW, 74);

  // "This certifies that"
  doc.setTextColor(BRAND.gray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('This is to certify that', contentX, 84);

  // Student name
  doc.setTextColor(BRAND.white);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(data.studentName, contentX, 98);

  // Underline name
  const nameWidth = doc.getTextWidth(data.studentName);
  doc.setDrawColor(BRAND.orange);
  doc.setLineWidth(0.3);
  doc.line(contentX, 100, contentX + nameWidth, 100);

  // "has successfully completed"
  doc.setTextColor(BRAND.gray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('has successfully completed the course', contentX, 110);

  // Course title
  doc.setTextColor(BRAND.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const courseLines = doc.splitTextToSize(data.courseTitle, contentW);
  doc.text(courseLines, contentX, 120);

  // Track badge (if provided)
  if (data.track) {
    const trackY = 120 + courseLines.length * 8;
    doc.setFillColor(30, 30, 30);
    doc.roundedRect(contentX, trackY, 60, 7, 1, 1, 'F');
    doc.setTextColor(BRAND.orange);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(data.track.toUpperCase(), contentX + 30, trackY + 4.5, { align: 'center' });
  }

  // ── Bottom metadata ───────────────────────────────────────────────────────
  const bottomY = H - 25;

  // Date issued
  doc.setTextColor(BRAND.gray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const dateStr = data.completionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text('DATE ISSUED', contentX, bottomY);
  doc.setTextColor(BRAND.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(dateStr, contentX, bottomY + 5);

  // Instructor
  if (data.instructorName) {
    doc.setTextColor(BRAND.gray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('INSTRUCTOR', contentX + 80, bottomY);
    doc.setTextColor(BRAND.white);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(data.instructorName, contentX + 80, bottomY + 5);
  }

  // Certificate ID
  const certId = generateCertificateId(data.studentId, data.courseId);
  doc.setTextColor(BRAND.gray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Certificate ID: ${certId}`, contentX + 160, bottomY);
  doc.text(`Verify at: fusion8.tech/verify/${certId}`, contentX + 160, bottomY + 4);

  // ── Fusion8 logo text ─────────────────────────────────────────────────────
  doc.setTextColor(BRAND.white);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FUSION8', 22, 20, { align: 'center' });

  doc.setTextColor(BRAND.orange);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('HARDTECH', 22, 25, { align: 'center' });
  doc.text('ECOSYSTEM', 22, 29, { align: 'center' });

  return doc.output('blob');
}

/**
 * Issues a certificate: generates the PDF, saves metadata to Firestore,
 * and returns the certificate record.
 *
 * Idempotent: if a certificate already exists for this student+course, returns it.
 */
export async function issueCertificate(data: CertificateData): Promise<Certificate> {
  const certDocId = `${data.studentId}_${data.courseId}`;
  const certRef = doc(firestore, 'certificates', certDocId);

  // Return existing certificate if already issued
  const existing = await getDoc(certRef);
  if (existing.exists()) {
    return existing.data() as Certificate;
  }

  const certId = generateCertificateId(data.studentId, data.courseId);
  const verificationUrl = `https://fusion8.tech/verify/${certId}`;

  const certificate: Omit<Certificate, 'issuedAt'> & { issuedAt: any } = {
    id: certId,
    studentId: data.studentId,
    courseId: data.courseId,
    studentName: data.studentName,
    courseTitle: data.courseTitle,
    issuedAt: serverTimestamp(),
    verificationUrl,
  };

  await setDoc(certRef, certificate);

  return { ...certificate, issuedAt: new Date() };
}

/**
 * Verify a certificate by ID. Returns null if the certificate does not exist.
 */
export async function verifyCertificate(certId: string): Promise<Certificate | null> {
  try {
    // Query by certificate ID (not the doc ID which is studentId_courseId)
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const q = query(
      collection(firestore, 'certificates'),
      where('id', '==', certId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as Certificate;
  } catch {
    return null;
  }
}

/**
 * Download a certificate PDF for the current user's browser.
 */
export async function downloadCertificate(data: CertificateData): Promise<void> {
  const blob = await generateCertificatePDF(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Fusion8_Certificate_${data.courseTitle.replace(/\s+/g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
