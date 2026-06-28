import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth-actions';

const FAPSHI_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://live.fapshi.com'
    : 'https://sandbox.fapshi.com';

const FAPSHI_API_USER = process.env.FAPSHI_API_USER!;
const FAPSHI_API_KEY = process.env.FAPSHI_API_KEY!;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ transId: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { transId } = await params;

  if (!transId || !/^[a-zA-Z0-9_-]+$/.test(transId)) {
    return NextResponse.json({ error: 'Invalid transaction ID.' }, { status: 400 });
  }

  try {
    const fapshiResponse = await fetch(
      `${FAPSHI_BASE_URL}/payment-status/${transId}`,
      {
        headers: {
          apiuser: FAPSHI_API_USER,
          apikey: FAPSHI_API_KEY,
        },
      }
    );

    const fapshiData = await fapshiResponse.json();

    if (!fapshiResponse.ok) {
      return NextResponse.json(
        { status: 'UNKNOWN', message: fapshiData.message },
        { status: 502 }
      );
    }

    return NextResponse.json({
      status: fapshiData.data?.status ?? 'UNKNOWN',
      amount: fapshiData.data?.amount,
      phone: fapshiData.data?.phone,
      message: fapshiData.message,
    });
  } catch (error: any) {
    console.error('[payments/status] Error:', error.message);
    return NextResponse.json({ status: 'UNKNOWN' }, { status: 502 });
  }
}
