import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require an authenticated session cookie.
// Role-level granularity is handled client-side by RoleGuard after the
// Firebase context resolves, but we block unauthenticated requests here
// so server-rendered HTML for protected pages is never sent to strangers.
const PROTECTED_PREFIXES = ['/student', '/teacher', '/admin'];

// The __session cookie is written by our setSessionCookie server action
// immediately after a successful Firebase sign-in.
const SESSION_COOKIE = '__session';

function isProtectedPath(pathname: string): boolean {
  // /admin/login is the admin-specific public login page — never block it
  if (pathname === '/admin/login') return false;
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function buildCSP(): string {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? `${projectId}.firebaseapp.com`;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? `${projectId}.appspot.com`;

  const directives: Record<string, string> = {
    'default-src': "'self'",

    'script-src': [
      "'self'",
      // Next.js inline scripts (nonce would be ideal; this is the pragmatic baseline)
      "'unsafe-inline'",
      "'unsafe-eval'", // required by Next.js dev/Turbopack; remove in strict prod if using nonces
      'https://apis.google.com',
      'https://www.gstatic.com',
      'https://*.firebaseio.com',
      'https://www.youtube.com',
      'https://s.ytimg.com',
    ].join(' '),

    'style-src': [
      "'self'",
      "'unsafe-inline'", // Tailwind CSS-in-JS + Radix UI inline styles
      'https://fonts.googleapis.com',
    ].join(' '),

    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:', // base64-encoded fonts for next/font
    ].join(' '),

    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:', // broad — tightened in Phase 2 once image domains are catalogued
    ].join(' '),

    'media-src': [
      "'self'",
      'blob:',
      'https://www.youtube.com',
      'https://*.youtube.com',
      `https://${storageBucket}`,
      'https://firebasestorage.googleapis.com',
    ].join(' '),

    'frame-src': [
      "'self'",
      'https://www.youtube.com',
      'https://youtube.com',
      `https://${authDomain}`,
      'https://accounts.google.com',
    ].join(' '),

    'connect-src': [
      "'self'",
      `https://${projectId}.firebaseio.com`,
      `wss://${projectId}.firebaseio.com`,
      'https://firestore.googleapis.com',
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
      'https://firebasestorage.googleapis.com',
      'https://www.googleapis.com',
      'https://live.fapshi.com',
      'https://sandbox.fapshi.com',
    ].join(' '),

    'object-src': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'",
    'frame-ancestors': "'none'",
    'upgrade-insecure-requests': '',
  };

  return Object.entries(directives)
    .map(([key, value]) => (value ? `${key} ${value}` : key))
    .join('; ');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ── Security headers ─────────────────────────────────────────────────────
  response.headers.set('Content-Security-Policy', buildCSP());
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  // ── Route protection ─────────────────────────────────────────────────────
  if (isProtectedPath(pathname)) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE);
    if (!sessionCookie?.value) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match every path except Next.js internals and static assets.
     */
    '/((?!_next/static|_next/image|favicon.ico|favicon.png|apple-touch-icon|icon).*)',
  ],
};
