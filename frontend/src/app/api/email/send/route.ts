import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth-actions';
import { buildHtmlBody, buildSubject, type EmailTemplate } from '@/services/email-service';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'noreply@fusion8.tech';
const FROM_NAME = 'Fusion8';

// Templates that only our backend (webhooks, server actions) should trigger.
// They require the x-internal-secret header — NOT a body flag, which any
// unauthenticated client could forge.
const SYSTEM_ONLY_TEMPLATES: EmailTemplate[] = [
  'teacher_approved',
  'teacher_rejected',
  'password_reset',
  'enrollment_confirmed',
  'live_session_reminder',
];

function isValidInternalRequest(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return false; // If secret is not configured, reject all internal calls
  return request.headers.get('x-internal-secret') === secret;
}

export async function POST(request: NextRequest) {
  let body: {
    to: string;
    template: EmailTemplate;
    data: Record<string, string | number | boolean>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const isSystemTemplate = SYSTEM_ONLY_TEMPLATES.includes(body.template);

  if (isSystemTemplate) {
    // System templates require the server-to-server shared secret.
    // A body field like _internal:true would be trivially forgeable by any client.
    if (!isValidInternalRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  } else {
    // User-triggered templates (e.g. contact form) require an authenticated session
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  }

  if (!SENDGRID_API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[email/send] DEV MODE — Email would be sent:');
      console.log('  To:', body.to);
      console.log('  Template:', body.template);
      console.log('  Data:', body.data);
      return NextResponse.json({ success: true, messageId: 'dev-mode-no-send' });
    }

    console.error('[email/send] SENDGRID_API_KEY is not configured.');
    return NextResponse.json(
      { error: 'Email service not configured.' },
      { status: 503 }
    );
  }

  const subject = buildSubject(body.template, body.data);
  const html = buildHtmlBody(body.template, body.data);

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: body.to }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[email/send] SendGrid error:', response.status, errorBody);
      return NextResponse.json(
        { error: 'Email delivery failed. Please try again.' },
        { status: 502 }
      );
    }

    const messageId = response.headers.get('x-message-id') ?? undefined;
    return NextResponse.json({ success: true, messageId });
  } catch (error: any) {
    console.error('[email/send] Network error:', error.message);
    return NextResponse.json(
      { error: 'Could not reach email service.' },
      { status: 502 }
    );
  }
}
