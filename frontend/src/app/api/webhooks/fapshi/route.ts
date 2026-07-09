import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

/**
 * Fapshi Webhook Handler
 *
 * Security model:
 * 1. Signature verification using HMAC-SHA256 with FAPSHI_WEBHOOK_SECRET
 * 2. Idempotency: checks enrollment status before writing — safe to receive twice
 * 3. Only the PAYMENT_SUCCESS event activates enrollment
 * 4. All other events are acknowledged (200) but ignored
 *
 * Fapshi sends a POST with:
 * {
 *   "event": "PAYMENT_SUCCESS" | "PAYMENT_FAILED",
 *   "data": {
 *     "transId": string,
 *     "externalId": string,   // our "{studentId}_{courseId}" composite key
 *     "amount": number,
 *     "phone": string,
 *     "status": "SUCCESSFUL" | "FAILED",
 *     "dateConfirmed": string
 *   }
 * }
 *
 * The X-Fapshi-Signature header contains HMAC-SHA256(rawBody, FAPSHI_WEBHOOK_SECRET).
 */

const WEBHOOK_SECRET = process.env.FAPSHI_WEBHOOK_SECRET;

function verifyFapshiSignature(rawBody: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    // If no secret is configured, log a warning and allow in development only.
    // Production deployments MUST set FAPSHI_WEBHOOK_SECRET.
    if (process.env.NODE_ENV === 'production') {
      console.error('[fapshi-webhook] FAPSHI_WEBHOOK_SECRET is not set. Rejecting request.');
      return false;
    }
    console.warn('[fapshi-webhook] FAPSHI_WEBHOOK_SECRET not set — skipping signature check (dev mode).');
    return true;
  }

  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-fapshi-signature') ?? '';

  if (!verifyFapshiSignature(rawBody, signature)) {
    console.warn('[fapshi-webhook] Signature verification failed. Possible forgery attempt.');
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  let payload: {
    event: string;
    data: {
      transId: string;
      externalId: string;
      amount: number;
      phone: string;
      status: string;
      dateConfirmed?: string;
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const { event, data } = payload;

  // Always acknowledge receipt to prevent Fapshi from retrying indefinitely
  // for events we intentionally ignore.
  if (event !== 'PAYMENT_SUCCESS') {
    console.log(`[fapshi-webhook] Received non-activation event: ${event}. Acknowledged.`);
    return NextResponse.json({ received: true });
  }

  if (!data?.externalId || !data?.transId) {
    console.error('[fapshi-webhook] Missing externalId or transId in payload.');
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  // externalId is our composite "{studentId}_{courseId}" key
  const enrollmentId = data.externalId;
  const enrollmentRef = adminDb.collection('enrollments').doc(enrollmentId);

  try {
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(enrollmentRef);

      // Idempotency: skip if already active (webhook fired twice)
      if (snap.exists && snap.data()?.status === 'active') {
        console.log(`[fapshi-webhook] Enrollment ${enrollmentId} already active. Skipping.`);
        return;
      }

      const activationData = {
        status: 'active',
        paymentReference: data.transId,
        transId: data.transId,
        amountConfirmed: data.amount,
        paymentConfirmedAt: FieldValue.serverTimestamp(),
        activatedAt: FieldValue.serverTimestamp(),
        lastAccessedAt: FieldValue.serverTimestamp(),
      };

      if (snap.exists) {
        tx.update(enrollmentRef, activationData);
      } else {
        // Webhook arrived before the pending record was written (race condition).
        // Reconstruct from the externalId — format: {studentId}_{courseId}
        const underscoreIndex = enrollmentId.indexOf('_');
        const studentId = enrollmentId.substring(0, underscoreIndex);
        const courseId = enrollmentId.substring(underscoreIndex + 1);

        tx.set(enrollmentRef, {
          id: enrollmentId,
          studentId,
          courseId,
          progress: 0,
          completedLessons: [],
          enrolledAt: FieldValue.serverTimestamp(),
          ...activationData,
        });
      }
    });

    console.log(`[fapshi-webhook] Enrollment ${enrollmentId} activated. TransId: ${data.transId}`);

    // Fire enrollment confirmation email asynchronously — do not block the webhook response
    const underscoreIdx = enrollmentId.indexOf('_');
    const courseId = enrollmentId.substring(underscoreIdx + 1);

    try {
      const courseDoc = await adminDb.collection('courses').doc(courseId).get();
      const courseTitle = courseDoc.exists
        ? (courseDoc.data()?.title ?? 'your course')
        : 'your course';

      // Fetch student data for the email
      const studentId = enrollmentId.substring(0, underscoreIdx);
      const studentDoc = await adminDb.collection('users').doc(studentId).get();
      if (studentDoc.exists) {
        const student = studentDoc.data()!;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fusion8.tech';

        // Trigger the email API route internally using the shared secret
        fetch(`${appUrl}/api/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '',
          },
          body: JSON.stringify({
            to: student.email,
            template: 'enrollment_confirmed',
            data: {
              name: student.displayName ?? 'Student',
              courseTitle,
              courseId,
              paymentReference: data.transId,
            },
          }),
        }).catch((err) =>
          console.error('[fapshi-webhook] Failed to send enrollment email:', err.message)
        );
      }
    } catch (emailErr: any) {
      console.error('[fapshi-webhook] Error preparing enrollment email:', emailErr.message);
    }

    return NextResponse.json({ received: true, enrolled: true });
  } catch (error: any) {
    console.error('[fapshi-webhook] Firestore transaction failed:', error.message);
    // Return 500 so Fapshi will retry — we want to guarantee activation
    return NextResponse.json({ error: 'Internal error. Retry pending.' }, { status: 500 });
  }
}
