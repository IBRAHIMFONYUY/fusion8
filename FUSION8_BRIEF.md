# FUSION8 — Complete AI Handoff Brief
> Version: June 2026 | Stack: Next.js 15 + Firebase | Status: Production-Ready Build

---

## 1. WHAT IS FUSION8?

FUSION8 is a Cameroonian engineering education platform — think **Coursera + ALX + Y Combinator + a hardware lab OS** combined into one. It is based in **Bamenda, Cameroon** and targets African engineers.

**Core mission:** Take a student from zero → enrolled → trained → building a startup, all inside one platform.

**Three user tiers:**
| Role | What they do |
|------|-------------|
| `admin` | Manages everything: users, courses, cohorts, blog, incubation pipeline, analytics |
| `teacher` | Delivers courses, grades, takes attendance, mentors students, reviews proposals |
| `student` | Learns courses, proposes projects, joins cohorts, starts startups |

**The platform is a hybrid:**
- **Digital Campus** — self-paced online (subscription: 15,000 XAF/month)
- **Onsite Accelerator** — 12-week intensive cohort in the Bamenda lab (application required)

---

## 2. TECH STACK (EXACT VERSIONS)

```
Next.js          15.3.8  (App Router, Turbopack, server components)
React            18.3
TypeScript       5.x     (strict mode — ZERO errors policy)
Tailwind CSS     3.x     (custom config, no arbitrary values)
Shadcn/ui        latest  (Radix UI primitives)
Firebase         10.x
  - Auth         (email/password + Google OAuth)
  - Firestore    (real-time listeners everywhere)
  - Storage      (course thumbnails, uploads)
  - Admin SDK    (server-side only, in /api routes)
date-fns         latest
recharts         latest  (analytics charts)
lucide-react     latest  (all icons — NEVER use other icon libraries)
```

**Firebase Project ID:** `fusion81-77505965-97563`

---

## 3. BRAND & DESIGN SYSTEM

### Colors (EXACT — never change these)
```
#fc031c  →  fire red   →  --accent          (354 98% 50%)   PRIMARY BRAND COLOR
#0a0001  →  charcoal   →  --primary         (354 100% 2%)   dark backgrounds, text
#e9f7f6  →  mint white →  --background      (176 47% 94%)   page background
#f7071f  →  hover red  →  used in animations/hover states only
```

All colors use **CSS HSL variables without the `hsl()` wrapper** (Shadcn/ui pattern):
```css
/* CORRECT */
background-color: hsl(var(--accent));
/* WRONG — do not do this */
background-color: var(--accent);
```

### Typography (EXACT — never change these)
```
font-headline  →  Oxanium         (headings, logo, uppercase titles)
font-body      →  Plus Jakarta Sans (body text — default)
font-code      →  JetBrains Mono  (code, monospace labels)
```
Loaded via `@next/font/google` in `src/app/layout.tsx`.

### Design Patterns
- Cards: `border-none shadow-lg rounded-2xl` or `rounded-3xl`
- Headings: `font-black font-headline tracking-tighter uppercase`
- Accent highlights: `text-accent` for labels/badges
- Buttons: `bg-accent hover:bg-accent/90 text-white`
- Loading states: `<Loader2 className="animate-spin text-accent" />` always
- Empty states: always use `<EmptyState icon={...} title="..." description="..." />`

---

## 4. REPOSITORY STRUCTURE

```
download (2)/
├── frontend/                  ← THE ENTIRE APP LIVES HERE
│   ├── src/
│   │   ├── app/               ← Next.js App Router pages
│   │   │   ├── (auth)/login/
│   │   │   ├── admin/         ← admin portal (role-gated)
│   │   │   ├── teacher/       ← teacher portal (role-gated)
│   │   │   ├── student/       ← student portal (role-gated)
│   │   │   ├── blog/          ← public blog
│   │   │   ├── courses/       ← public course catalog
│   │   │   ├── projects/      ← public projects showcase
│   │   │   ├── apply/         ← cohort application form
│   │   │   ├── subscribe/     ← pricing page
│   │   │   ├── become-instructor/
│   │   │   ├── page.tsx       ← landing page
│   │   │   ├── layout.tsx     ← root layout (fonts, providers)
│   │   │   └── globals.css    ← all CSS variables & base styles
│   │   ├── components/
│   │   │   ├── ui/            ← Shadcn/ui components (DO NOT EDIT)
│   │   │   ├── auth/          ← AuthProvider, RoleGuard
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── sidebar-nav.tsx
│   │   │   ├── user-nav.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── enrollment-payment-dialog.tsx
│   │   │   ├── proposal-review-dialog.tsx
│   │   │   └── ... (20+ more)
│   │   ├── lib/
│   │   │   ├── auth.ts        ← signUp/signIn/signOut, role logic
│   │   │   ├── nav.ts         ← all sidebar navigation items by role
│   │   │   └── utils.ts       ← cn() helper
│   │   ├── types/
│   │   │   └── index.ts       ← ALL TypeScript types (single source of truth)
│   │   ├── services/
│   │   │   ├── payment-service.ts   ← MTN MoMo / Fapshi enrollment
│   │   │   ├── lms-service.ts
│   │   │   ├── enrollment-service.ts
│   │   │   ├── notification-service.ts
│   │   │   └── project-service.ts
│   │   ├── hooks/
│   │   │   ├── useCourseBuilder.ts
│   │   │   └── use-toast.ts
│   │   └── firebase/
│   │       ├── index.ts       ← exports everything
│   │       ├── config.ts      ← Firebase config (reads .env)
│   │       ├── provider.tsx   ← AuthProvider with onSnapshot listener
│   │       ├── firestore/
│   │       │   ├── use-collection.tsx  ← real-time list hook
│   │       │   └── use-doc.tsx         ← real-time single doc hook
│   │       └── non-blocking-updates.tsx
│   ├── .env                   ← NEVER commit — real credentials
│   ├── .env.example           ← committed empty template
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   └── package.json
├── firestore.rules            ← Security rules (deploy with Firebase CLI)
└── FUSION8_BRIEF.md           ← THIS FILE
```

---

## 5. ENVIRONMENT VARIABLES

File: `frontend/.env` (never commit this file — protected by .gitignore)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fusion81-77505965-97563
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_ADMIN_PROJECT_ID=fusion81-77505965-97563
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=        ← ROTATE THIS — old key was exposed in chat
```

**CRITICAL SECURITY NOTE:** The Firebase Admin private key was accidentally pasted into a chat window. It MUST be rotated:
1. Firebase Console → Project Settings → Service Accounts
2. Generate new private key → download JSON
3. Copy new key into `.env`
4. Delete the old service account key

---

## 6. AUTHENTICATION & ROLES

### How auth works
1. `firebase/provider.tsx` — listens to `onAuthStateChanged` + `onSnapshot` on `users/{uid}`
2. Every page wrapped in `<AuthProvider>` → `useAuth()` hook available everywhere
3. Role is stored in Firestore `users/{uid}.role` field
4. `PLATFORM_ADMIN_EMAIL = 'ceo@fusion8.com'` auto-assigns admin role on signup

### Role assignment logic (`src/lib/auth.ts`)
```
ceo@fusion8.com   → role: 'admin'   (hardcoded)
all others        → role: 'student' (default on signup)
admin promotes    → teacher/admin via /admin/users page
```

### Route protection
- `src/components/auth/RoleGuard.tsx` — wraps role-specific layouts
- `src/middleware.ts` — protects `/admin/*`, `/teacher/*`, `/student/*`
- Unauthenticated → `/login`
- Wrong role → `/unauthorized`

### `useAuth()` returns
```ts
{
  user: FirebaseUser | null,
  role: UserRole | null,        // 'student' | 'teacher' | 'admin'
  profile: UserProfile | null,  // full Firestore user document
  isLoading: boolean,
  firestore: Firestore,
  storage: FirebaseStorage,
}
```

---

## 7. FIRESTORE DATA MODEL

### Collections

#### `users/{uid}`
```ts
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string | null,
  role: 'student' | 'teacher' | 'admin',
  approved: boolean,           // teachers need approval
  matricule: string,           // student ID
  mentorId: string | null,     // assigned mentor (teacher uid)
  mentorName: string | null,
  cohortId: string | null,
  currentStreak: number,       // days
  longestStreak: number,
  lastActiveDate: string,      // ISO date string
  xp: number,
  onboardingComplete: boolean,
  createdAt: Timestamp,
}
```

#### `courses/{courseId}`
```ts
{
  title, description, longDescription,
  teacherId, teacherName,
  price: number,               // XAF
  thumbnail: string,           // URL
  category, level, duration,
  published: boolean,
  createdAt: Timestamp,
  // subcollections:
  // courses/{id}/modules/{moduleId}
  // courses/{id}/lessons/{lessonId}
  // courses/{id}/recordings/{recordingId}
}
```

#### `enrollments/{enrollmentId}`
```ts
{
  studentId, courseId, status: 'active'|'pending_payment'|'expired',
  paymentReference, enrolledAt, completedLessons: string[],
  progress: number,            // 0-100
}
```

#### `assignments/{assignmentId}`
```ts
{
  title, description, courseId, teacherId,
  dueDate: Timestamp,
  maxScore: number,
  // submissions stored in submissions collection
}
```

#### `submissions/{submissionId}`
```ts
{
  assignmentId, studentId, courseId,
  content, fileUrl,
  grade: number | null,
  feedback: string | null,
  submittedAt: Timestamp,
  gradedAt: Timestamp | null,
}
```

#### `projects/{projectId}`
```ts
{
  title, description, category,
  leadStudentId, teamMembers: Record<string, boolean>,
  status: 'planning'|'in-progress'|'completed'|'archived',
  githubUrl, demoUrl, imageUrl,
  createdAt: Timestamp,
}
```

#### `project_proposals/{proposalId}`
```ts
{
  title, problemStatement, proposedSolution,
  skillsNeeded: string[],
  studentLeadId, studentName,
  status: 'pending'|'approved'|'rejected',
  reviewNotes: string,
  submittedAt: Timestamp,
}
```

#### `broadcasts/{broadcastId}`
```ts
{
  title, teacherId, teacherName,
  date: string,                // ISO date
  time: string,                // "14:00"
  streamUrl: string,
  // subcollection: broadcasts/{id}/attendance/{uid}
}
```

#### `cohort_applications/{applicationId}`
```ts
{
  studentId, studentName, studentEmail,
  track: EngineeringTrack,
  motivation: string,
  status: 'pending'|'approved'|'rejected',
  submittedAt: Timestamp,
}
```

#### `cohorts/{cohortId}`
```ts
{
  name, track: EngineeringTrack,
  startDate, endDate,
  instructorId, status: 'upcoming'|'active'|'completed',
  enrolledCount, capacity,
  location: 'Bamenda',
  description,
}
```

#### `blog_posts/{postId}`
```ts
{
  title, slug,                 // slug auto-generated from title
  excerpt,                     // 200 char summary
  content,                     // full text (markdown-like)
  coverImageUrl,
  category,                    // from CATEGORIES list
  tags: string[],
  status: 'draft'|'published',
  authorId, authorName,
  createdAt: Timestamp,
  publishedAt: Timestamp | null,
}
```

#### `startups/{startupId}`
```ts
{
  name, tagline, description, category,
  stage: 'idea'|'validation'|'mvp'|'growth'|'scaling',
  status: 'incubating'|'graduated'|'paused'|'rejected',
  founderId, founderName,
  teamMembers: Record<string, boolean>,
  skills: string[],
  pitchDeckUrl, demoUrl,
  fundingGoal, fundingReceived,
  milestones: Milestone[],
  cohortId, reviewNotes, sponsorId,
  createdAt: Timestamp,
}
```

#### `mentor_sessions/{sessionId}`
```ts
{
  mentorId, studentId, studentName,
  scheduledAt: Timestamp,
  durationMinutes: number,
  type: 'office_hours'|'project_review'|'career'|'technical',
  status: 'scheduled'|'completed'|'cancelled',
  notes, feedback,
  rating: number | null,
}
```

#### `mentor_notes/{noteId}`
```ts
{
  mentorId, studentId,
  content: string,
  private: boolean,
  createdAt: Timestamp,
}
```

#### `notifications/{notificationId}`
```ts
{
  userId | null,               // null = broadcast to all
  targetRole: UserRole | null,
  audience: 'all' | null,
  title, message,
  type: 'info'|'success'|'warning',
  read: boolean,
  createdAt: Timestamp,
}
```

---

## 8. ALL PAGES — WHAT EACH ONE DOES

### Public Pages (no login required)
| Route | Description |
|-------|-------------|
| `/` | Full landing page — hero, stats, course previews, cohort CTA, lab section |
| `/courses` | Public course catalog with search/filter |
| `/courses/[id]` | Course detail with syllabus accordion, enroll button, payment dialog |
| `/projects` | Innovation hub — all published projects |
| `/projects/[id]` | Individual project detail |
| `/blog` | Public blog listing — featured post + grid, search + category filter |
| `/blog/[slug]` | Individual blog post — shareable URL, copy/share buttons |
| `/subscribe` | Pricing page — Digital Campus (15,000 XAF/mo) vs Onsite Accelerator |
| `/apply` | Cohort application form |
| `/become-instructor` | Teacher recruitment page |
| `/login` | Email/password + Google auth |

### Admin Portal (`/admin/*`)
| Route | Description |
|-------|-------------|
| `/admin/dashboard` | KPI cards + recent activity overview |
| `/admin/users` | User management — approve teachers, assign mentors, change roles, search |
| `/admin/courses` | Course governance — publish/unpublish, view all teacher courses |
| `/admin/cohorts` | Cohort admissions — review applications, create cohorts, assign students |
| `/admin/incubation` | Startup pipeline — all startups, proposal pipeline, Demo Day tab |
| `/admin/blog` | **Blog CMS** — create/edit/delete posts, publish/draft toggle, cover image, tags |
| `/admin/analytics` | Platform analytics — real Firestore data, engagement funnel BarChart, cohort health |

### Teacher Portal (`/teacher/*`)
| Route | Description |
|-------|-------------|
| `/teacher/dashboard` | Teacher's overview — active courses, recent submissions, streak |
| `/teacher/courses` | My courses list |
| `/teacher/courses/builder` | Full course builder — modules, lessons, video upload |
| `/teacher/courses/[id]/roster` | Student roster for a course |
| `/teacher/assignments` | Create + grade assignments |
| `/teacher/gradebook` | Grade all students across all courses |
| `/teacher/schedule` | Schedule live sessions/broadcasts |
| `/teacher/attendance` | Attendance tracking — sessions held, attendance rate, per-session attendee list |
| `/teacher/mentorship` | Mentorship hub — 3 tabs: My Mentees, Sessions, Notes Archive |
| `/teacher/proposal-review` | Review student project proposals — approve/reject with notes |
| `/teacher/live-session/[id]` | Live broadcast view for Bamenda Lab 01 |
| `/teacher/notifications` | Teacher notifications |

### Student Portal (`/student/*`)
| Route | Description |
|-------|-------------|
| `/student/dashboard` | Student's home — XP bar, streak, enrolled courses, upcoming assignments |
| `/student/courses` | All enrolled courses with progress |
| `/student/courses/[id]` | Course detail — lesson list, progress |
| `/student/courses/[id]/lesson/[lessonId]` | Lesson viewer — video + notes |
| `/student/courses/[id]/recording/[recordingId]` | Recorded session viewer |
| `/student/learn/[courseId]` | Guided learn flow |
| `/student/profile` | Portfolio page — achievements gallery, XP level, stats, projects |
| `/student/assignments` | My assignments — pending/submitted/graded |
| `/student/projects` | My projects — lead & collaborating |
| `/student/propose` | 3-step proposal form → Firestore `project_proposals` |
| `/student/cohort` | Cohort dashboard — mate grid, announcements, timeline, track skills |
| `/student/incubation` | Innovation lab / startup command center |
| `/student/live` | Live broadcast feed (Bamenda Lab 01) |
| `/student/notifications` | Student notifications |
| `/student/settings` | Account settings |

---

## 9. KEY CODING PATTERNS

### Real-time Firestore data (USE THIS EVERYWHERE)
```tsx
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

const { firestore, user } = useAuth();

const myQuery = useMemoFirebase(() => {
  if (!firestore || !user) return null;
  return query(
    collection(firestore, 'my_collection'),
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc')
  );
}, [firestore, user]);

const { data: items, isLoading } = useCollection(myQuery);
```

### One-time Firestore reads
```tsx
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
```

### Write to Firestore
```tsx
// Create
await addDoc(collection(firestore, 'collection_name'), {
  field: value,
  createdAt: serverTimestamp(),
});

// Update
await updateDoc(doc(firestore, 'collection_name', docId), {
  field: newValue,
});

// Delete
await deleteDoc(doc(firestore, 'collection_name', docId));
```

### Loading state pattern
```tsx
if (isLoading) {
  return (
    <div className="flex flex-col items-center justify-center p-24">
      <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
      <p className="text-muted-foreground animate-pulse uppercase tracking-widest text-xs">Loading...</p>
    </div>
  );
}
```

### Toast notifications
```tsx
import { useToast } from '@/hooks/use-toast';
const { toast } = useToast();
toast({ title: 'Success', description: 'Done!' });
toast({ variant: 'destructive', title: 'Error', description: err.message });
```

### All pages inside `/student/*`, `/teacher/*`, `/admin/*` DO NOT include `<Header>` or `<Footer>` — those are in the portal layouts. Only public pages use `<Header />` + `<Footer />`.

---

## 10. NAVIGATION CONFIG

File: `src/lib/nav.ts`

```ts
Admin (7 items):  Dashboard, Cohort Admissions, User Management,
                  Course Governance, Innovation Pipeline, Blog, Analytics

Teacher (8 items): Dashboard, My Courses, Mentorship, Assignments,
                   Gradebook, Schedule, Attendance, Proposal Review

Student (8 items): Dashboard, My Learning, Live Sessions, Projects,
                   My Cohort, Innovation Lab, Assignments, Notifications
```

---

## 11. PAYMENT SYSTEM

- Provider: **Fapshi** (Cameroonian payment gateway — MTN MoMo + Orange Money)
- Currency: **XAF** (Central African Franc)
- Subscription: **15,000 XAF/month** (Digital Campus)
- Current state: `payment-service.ts` simulates a 3-second delay. **Replace the `TODO: Fapshi webhook` comment** with the real Fapshi API call when going live.
- Enrollment flow: Create `enrollments` doc → pending_payment → confirmed active → student gets access

---

## 12. FIRESTORE SECURITY RULES

File: `firestore.rules` (root of project, NOT inside frontend/)

Deploy with: `firebase deploy --only firestore:rules`

Rules summary:
- **Public read**: `courses`, `blog_posts`
- **Authenticated read**: most collections
- **Own data only**: users can only write their own `users/{uid}` doc
- **Role-checked writes**: admin/teacher roles checked via `get()` on users collection
- **Admin-only**: cohorts write, blog_posts write, user role changes

---

## 13. ACHIEVEMENTS SYSTEM

Defined in `src/types/index.ts` — `deriveAchievements()` pure function.

10 achievements computed from existing Firestore data (no separate collection):
| ID | Name | Trigger |
|----|------|---------|
| `first_lesson` | First Step | completedLessons.length >= 1 |
| `course_complete` | Course Conqueror | any enrollment progress == 100 |
| `week_streak` | Week Warrior | currentStreak >= 7 |
| `month_streak` | Iron Discipline | currentStreak >= 30 |
| `first_project` | Builder | projects.length >= 1 |
| `team_player` | Team Player | any project with teamMembers > 1 |
| `first_submission` | Submitter | submissions.length >= 1 |
| `proposal_approved` | Innovator | any proposal status == 'approved' |
| `five_courses` | Knowledge Seeker | enrollments.length >= 5 |
| `top_student` | Top Student | xp >= 1000 |

---

## 14. XP SYSTEM

Computed in `src/types/index.ts` — not stored in Firestore, derived on render:
```
XP = (completedLessons × 10) + (assignments × 50) + (projects × 100) + (achievements × 200)
Level = Math.floor(xp / 500) + 1
```

---

## 15. WHAT IS FULLY BUILT

- [x] Complete landing page with all sections
- [x] Auth system (email + Google, role-based)
- [x] Admin portal (dashboard, users, courses, cohorts, incubation, blog, analytics)
- [x] Teacher portal (dashboard, courses, builder, gradebook, assignments, attendance, mentorship, schedule, proposal-review, live-session)
- [x] Student portal (dashboard, courses, lessons, assignments, projects, profile, cohort, incubation, live, propose, notifications, settings)
- [x] Public blog (listing + individual post pages with share functionality)
- [x] Payment integration (Fapshi simulation)
- [x] Achievement + XP system
- [x] Startup incubation pipeline (student + admin views)
- [x] Mentorship system (teacher mentors + student mentees)
- [x] Cohort system (applications + cohort dashboard)
- [x] Real-time Firestore everywhere (no mock data)
- [x] Firestore security rules
- [x] Brand colors (#fc031c red, #0a0001 black, #e9f7f6 mint)
- [x] All lab references use "Bamenda Lab 01"
- [x] Production build passes (49 routes, zero TypeScript errors)

---

## 16. WHAT IS NOT YET BUILT (FUTURE WORK)

- [ ] **Fapshi real API integration** — replace simulation in `payment-service.ts`
- [ ] **Rich text editor for blog** — currently plain textarea; add TipTap or similar
- [ ] **Video upload to Firebase Storage** — course builder has UI but upload logic needs wiring
- [ ] **Live video streaming** — broadcasts show a feed but no actual WebRTC/stream integration
- [ ] **Certificate generation** — achievements mention certificates but no PDF generation
- [ ] **Push notifications** — notification bell exists but no FCM wiring
- [ ] **Search (global)** — no full-text search across courses/projects; consider Algolia
- [ ] **Mobile app** — platform is web-only, no React Native version
- [ ] **Email system** — no transactional emails on signup/enrollment
- [ ] **Sponsor/Partnership portal** — nav item exists but no page built
- [ ] **Admin proposal page** — `/admin/proposals` referenced but not yet in nav
- [ ] **Teacher live dashboard** — teacher can schedule but no analytics on broadcast attendance
- [ ] **Student lab booking** — `LabBooking` type defined but no booking UI

---

## 17. HOW TO RUN LOCALLY

```bash
cd "download (2)/frontend"
npm install
# create .env from .env.example and fill in Firebase credentials
npm run dev         # starts at http://localhost:3000
```

**Build check:**
```bash
npx tsc --noEmit    # must show zero output (zero errors)
npm run build       # must complete with ✓ Compiled successfully
```

---

## 18. HOW TO DEPLOY

**Recommended: Vercel**
```bash
npx vercel --prod
```
Set all env vars from section 5 in the Vercel dashboard before deploying.

**Deploy Firestore rules (run from project root, not frontend/):**
```bash
firebase deploy --only firestore:rules
```

---

## 19. IMPORTANT CONSTRAINTS (NEVER VIOLATE)

1. **Keep Firebase** — do NOT suggest MongoDB, Supabase, or any other backend
2. **Colors are locked** — only `#fc031c`, `#0a0001`, `#e9f7f6`, `#f7071f`. No teal, no yellow, no blue
3. **Fonts are locked** — Oxanium (headlines), Plus Jakarta Sans (body), JetBrains Mono (code)
4. **Zero TypeScript errors** — `npx tsc --noEmit` must always be clean
5. **No mock data** — everything reads/writes real Firestore
6. **No random data** — no `Math.random()` in production pages
7. **Bamenda** — the lab is in Bamenda, not Yaoundé (old references were corrected)
8. **Admin email** — `ceo@fusion8.com` is the hardcoded platform admin
9. **Never commit `.env`** — `.env.example` stays empty as a template
10. **No comments explaining WHAT code does** — only WHY when non-obvious
11. **No new UI libraries** — use lucide-react for icons, Shadcn/ui for components only

---

## 20. CONTACT & SUPPORT

- Platform admin email: `ceo@fusion8.com`
- Support email: `support@fusion8.com`
- Location: Bamenda, Cameroon
- Firebase project: `fusion81-77505965-97563`
