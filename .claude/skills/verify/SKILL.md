# Fusion8 Verify Skill

## Stack
Next.js 15 App Router, Firebase Auth/Firestore, Turbopack dev server.

## Launch
```bash
cd frontend
npm run dev   # starts on port 9002 with --turbopack
```

## Surfaces to drive
- HTTP: `curl -s -o /dev/null -w "%{http_code}" http://localhost:9002/<path>`
- API routes: POST to `/api/payments/initiate`, `/api/email/send`, `/api/webhooks/fapshi`
- Source grep for logic not visible in SSR HTML

## Route structure
- Public: `/`, `/academy`, `/apply`, `/community`, `/courses`, `/labs`, `/about`, `/login` (has Register tab), `/forgot-password`, `/verify/[certId]`, `/become-instructor`
- Student (→ 307 unauthenticated): `/student/*` — dashboard, courses, assignments, notifications, live, projects, cohort, incubation, profile, settings
- Teacher (→ 307): `/teacher/*` — dashboard, courses, assignments, gradebook, profile, mentorship, schedule, attendance, proposal-review
- Admin (→ 307): `/admin/*` — dashboard, cohorts, users, courses, incubation, blog, analytics
- API: `/api/payments/initiate` (401 unauthed), `/api/email/send` (401/internal secret), `/api/webhooks/fapshi`

## Gotchas
- No `/signup` route — Register is a tab on `/login`
- Auth-gated routes return 307 (redirect to /login) when unauthenticated — that's correct
- Firebase singleton (`firestore`) is module-level; `useAuth` hook requires FirebaseClientProvider
- Public pages outside `(app)` route group must NOT use `useAuth` — use module-level `firestore` import instead
- Dev mode: FAPSHI_WEBHOOK_SECRET empty → signature check skipped (expected)
