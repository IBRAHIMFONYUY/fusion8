import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth-actions';

const FAPSHI_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://live.fapshi.com'
    : 'https://sandbox.fapshi.com';

const FAPSHI_API_USER = process.env.FAPSHI_API_USER!;
const FAPSHI_API_KEY = process.env.FAPSHI_API_KEY!;

// Fapshi supported phone networks
const NETWORK_MAP: Record<string, string> = {
  MTN: 'MTN_MOMO',
  Orange: 'ORANGE_MONEY',
};

export async function POST(request: NextRequest) {
  // Verify caller is authenticated
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (!FAPSHI_API_USER || !FAPSHI_API_KEY) {
    console.error('[payments/initiate] Fapshi credentials not configured.');
    return NextResponse.json(
      { error: 'Payment service is not configured. Contact support.' },
      { status: 503 }
    );
  }

  let body: {
    amount: number;
    phone: string;
    email: string;
    network: 'MTN' | 'Orange';
    studentId: string;
    courseId: string;
    courseTitle?: string;
    studentName?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { amount, phone, email, network, studentId, courseId, courseTitle, studentName } = body;

  // Validate that the authenticated user is initiating payment for themselves
  if (session.uid !== studentId) {
    return NextResponse.json(
      { error: 'You can only initiate payment for your own account.' },
      { status: 403 }
    );
  }

  // Input validation
  if (!amount || amount < 100) {
    return NextResponse.json({ error: 'Invalid payment amount.' }, { status: 400 });
  }
  if (!phone || !/^6[5-9]\d{7}$/.test(phone.replace(/\s/g, ''))) {
    return NextResponse.json(
      { error: 'Invalid Cameroon phone number. Use format: 6XXXXXXXX' },
      { status: 400 }
    );
  }
  if (!['MTN', 'Orange'].includes(network)) {
    return NextResponse.json({ error: 'Network must be MTN or Orange.' }, { status: 400 });
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://fusion8.tech'}/api/webhooks/fapshi`;
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://fusion8.tech'}/student/courses/${courseId}?payment=complete`;

  try {
    const fapshiResponse = await fetch(`${FAPSHI_BASE_URL}/initiate-pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apiuser: FAPSHI_API_USER,
        apikey: FAPSHI_API_KEY,
      },
      body: JSON.stringify({
        amount,
        phone: phone.replace(/\s/g, ''),
        medium: NETWORK_MAP[network],
        name: studentName ?? 'Fusion8 Student',
        email,
        userId: studentId,
        externalId: `${studentId}_${courseId}`,
        message: `Enrollment: ${courseTitle ?? courseId}`,
        redirectUrl,
        webhookUrl,
      }),
    });

    const fapshiData = await fapshiResponse.json();

    if (!fapshiResponse.ok || fapshiData.status !== 200) {
      console.error('[payments/initiate] Fapshi API error:', fapshiData);
      return NextResponse.json(
        {
          error:
            fapshiData.message ??
            'Payment initiation failed. Please check your phone number and try again.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      transId: fapshiData.data?.transId,
      message: 'A payment prompt has been sent to your phone. Please approve it to complete enrollment.',
    });
  } catch (error: any) {
    console.error('[payments/initiate] Network error calling Fapshi:', error.message);
    return NextResponse.json(
      { error: 'Could not reach the payment provider. Please try again.' },
      { status: 502 }
    );
  }
}
