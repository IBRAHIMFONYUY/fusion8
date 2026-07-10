import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth-actions';
import { adminDb } from '@/firebase/admin';

export async function POST(request: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: { courseId: string; title: string; date: string; time: string; meetLink?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const { courseId, title, date, time, meetLink } = body;
  if (!courseId || !title || !date || !time) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const secret = process.env.INTERNAL_API_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:9002';

  try {
    const enrollmentsSnap = await adminDb
      .collection('enrollments')
      .where('courseId', '==', courseId)
      .where('status', '==', 'active')
      .get();

    const studentIds: string[] = enrollmentsSnap.docs
      .map((d) => d.data().studentId as string)
      .filter(Boolean);

    if (studentIds.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    const students: { email: string; name: string }[] = [];
    for (let i = 0; i < studentIds.length; i += 30) {
      const chunk = studentIds.slice(i, i + 30);
      const refs = chunk.map((id) => adminDb.collection('users').doc(id));
      const userDocs = await adminDb.getAll(...refs);
      userDocs.forEach((d) => {
        if (d.exists) {
          const data = d.data()!;
          if (data.email) {
            students.push({
              email: data.email as string,
              name: (data.displayName as string) ?? 'Student',
            });
          }
        }
      });
    }

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const results = await Promise.allSettled(
      students.map(({ email, name }) =>
        fetch(`${appUrl}/api/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(secret ? { 'x-internal-secret': secret } : {}),
          },
          body: JSON.stringify({
            to: email,
            template: 'live_session_reminder',
            data: {
              name,
              title,
              date: formattedDate,
              time,
              meetLink: meetLink ?? '',
              courseId,
            },
          }),
        })
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return NextResponse.json({ success: true, sent });
  } catch (error: any) {
    console.error('[broadcasts/notify] Error:', error.message);
    return NextResponse.json({ error: 'Notification failed.' }, { status: 500 });
  }
}
