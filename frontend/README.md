# Fusion8 — Frontend

Next.js 15 web application for the Fusion8 incubation & acceleration platform.

**Runtime:** Node.js 20+ · Next.js 15.3.8 (App Router + Turbopack)  
**Port:** 9002 (dev)

---

## Getting Started

```bash
npm install
npm run dev        # http://localhost:9002
npm run build      # Production build (runs type check + lint)
npm run typecheck  # TypeScript check only
npm run lint       # ESLint only
```

### AI Flows (Genkit)

```bash
npm run genkit:dev    # Start Genkit dev UI + flows
npm run genkit:watch  # Same with hot reload
```

---

## Project Structure

```
src/
├── app/                    Pages (Next.js App Router)
│   ├── page.tsx            Home / Landing page
│   ├── layout.tsx          Root layout (FirebaseClientProvider)
│   ├── error.tsx           Global error boundary
│   ├── (auth)/login/       Public login & registration
│   ├── courses/            Public course catalog
│   ├── projects/           Public innovation hub
│   ├── apply/              Cohort application form
│   ├── become-instructor/  Partner / instructor application
│   ├── subscribe/          Payment & subscription
│   ├── student/            Student portal (role-protected)
│   ├── teacher/            Teacher portal (role-protected)
│   └── admin/              Admin portal (role-protected)
│
├── components/             Reusable UI components
│   ├── ui/                 Shadcn/Radix base components (50+ files)
│   ├── auth/               AuthProvider, RoleGuard
│   ├── header.tsx          Global navigation header
│   ├── footer.tsx          Global footer
│   ├── sidebar-nav.tsx     Dashboard sidebar (all roles)
│   ├── dashboard-header.tsx Dashboard top bar
│   └── ...                 Dialogs, forms, video player, etc.
│
├── services/               Firestore data layer
│   ├── lms-service.ts      Course catalog, curriculum, admin ops
│   ├── payment-service.ts  Enrollment & MTN MoMo (Fapshi — mocked)
│   ├── enrollment-service.ts Lesson completion & progress tracking
│   ├── notification-service.ts Fan-out notifications
│   ├── project-service.ts  Project hub CRUD
│   └── course-service.ts   Legacy (superseded by lms-service)
│
├── firebase/               Firebase setup & context
│   ├── config.ts           Firebase app config (env vars)
│   ├── index.ts            Singleton init — exports auth, firestore, storage
│   ├── provider.tsx        Auth context — user, role, approved, isLoading
│   ├── client-provider.tsx Hydration-safe wrapper for FirebaseProvider
│   ├── admin.ts            Firebase Admin SDK (server actions only)
│   ├── error-emitter.ts    Pub/sub for Firestore permission errors
│   ├── errors.ts           FirestorePermissionError with full request context
│   └── firestore/          useCollection, useDoc hooks
│
├── ai/                     Genkit AI integration
│   ├── genkit.ts           Gemini 2.5 Flash config
│   ├── dev.ts              Dev entry point
│   └── flows/
│       ├── course-content-summarization.ts   Summarize lesson content
│       └── generate-course-summary.ts        Generate course overview
│
├── hooks/
│   ├── useCourseBuilder.ts Full curriculum builder state management
│   ├── useProjectHub.ts    Project hub filter state
│   └── use-toast.ts        Radix toast notifications
│
├── lib/
│   ├── auth.ts             Client-side Firebase Auth helpers
│   ├── auth-actions.ts     Server Actions for auth (signup, login, logout)
│   ├── actions.ts          Server Action for AI summary
│   └── nav.ts              Role-based navigation items
│
└── types/
    └── index.ts            TypeScript interfaces (User, Project, Course, etc.)
```

---

## Routes Reference

### Public

| Route | Description |
|---|---|
| `/` | Landing page — hero, programs, testimonials, pipeline |
| `/courses` | Published course catalog |
| `/courses/[id]` | Course detail & enrollment |
| `/projects` | Innovation Hub — active projects |
| `/projects/[id]` | Project detail & team joining |
| `/apply` | Cohort application form |
| `/become-instructor` | Instructor / partner application |
| `/login` | Email/password + Google OAuth |
| `/subscribe` | Payment flow (MTN MoMo) |
| `/unauthorized` | Access denied page |

### Student Portal (`/student/*`)

Requires authenticated user with `student` or `admin` role.

| Route | Description |
|---|---|
| `/student/dashboard` | Enrolled courses, progress overview |
| `/student/courses` | My courses list |
| `/student/courses/[id]` | Course detail (enrolled view) |
| `/student/courses/[id]/lesson/[lessonId]` | Lesson video player + content |
| `/student/courses/[id]/recording/[recordingId]` | Past live session recording |
| `/student/learn/[courseId]` | Structured learning interface |
| `/student/assignments` | Pending & submitted assignments |
| `/student/projects` | My projects |
| `/student/propose` | Submit project proposal |
| `/student/live` | Join live session |
| `/student/notifications` | Notification center |
| `/student/profile` | Portfolio & profile |
| `/student/settings` | Account settings |

### Teacher Portal (`/teacher/*`)

Requires `teacher` role + admin approval (in `approved_teachers` collection).

| Route | Description |
|---|---|
| `/teacher/dashboard` | Courses taught, student counts, metrics |
| `/teacher/courses` | My courses list |
| `/teacher/courses/builder` | Course builder — modules & lessons (drag/drop) |
| `/teacher/courses/[id]/roster` | Enrolled students list |
| `/teacher/schedule` | Schedule live sessions |
| `/teacher/attendance` | Attendance tracking |
| `/teacher/live-session/[id]` | Broadcast live teaching session |
| `/teacher/gradebook` | Grade submissions & assignments |
| `/teacher/proposal-review` | Review student project proposals |
| `/teacher/notifications` | New submissions, grading alerts |

### Admin Portal (`/admin/*`)

Requires `admin` role.

| Route | Description |
|---|---|
| `/admin/dashboard` | Platform health, user counts, system metrics |
| `/admin/users` | User management, teacher approval |
| `/admin/courses` | Course governance, publish/reject |
| `/admin/cohorts` | Cohort admissions, matricule ID assignment |
| `/admin/analytics` | Platform-wide analytics & reports |
| `/admin/login` | Admin-specific login |

---

## Services Reference

### `lms-service.ts`

```typescript
lmsService.getCatalog()                              // All published courses
lmsService.getPopularCourses(limit?)                 // Top N by enrolledCount
lmsService.getCourseById(courseId)                   // Full course + modules + lessons
lmsService.getAllCoursesAdmin()                       // All courses (admin)
lmsService.getTeacherCourses(teacherId)              // Courses by teacher
lmsService.saveCourseCurriculum(teacherId, data)     // Create/update full curriculum
lmsService.updateCourseStatus(courseId, status)      // draft|pending|approved|published
lmsService.deleteCourse(courseId)                    // Cascade delete (modules + lessons)
```

### `payment-service.ts`

```typescript
paymentService.initiatePayment(data)                 // Creates enrollment (mocked 3s delay)
paymentService.checkEnrollmentStatus(uid, courseId)  // Returns status string or null
```

**Payment flow:**
1. Creates enrollment doc with `status: 'pending'`
2. Waits 3 seconds (replace with real Fapshi webhook)
3. Updates to `status: 'active'` + saves `paymentReference: 'FAP-{random}'`

### `notification-service.ts`

```typescript
notificationService.notifyUser(userId, payload)           // Single user
notificationService.notifyAllStudents(payload)            // All students (batch)
notificationService.notifyCourseStudents(courseId, payload) // Enrolled students only
```

### `project-service.ts`

```typescript
projectService.getActiveProjects()          // recruiting + in_progress
projectService.createProject(uid, data)     // New project (student-led)
projectService.joinProject(id, uid, role?)  // Join as team member
```

### `enrollment-service.ts`

```typescript
markLessonComplete(db, studentId, courseId, lessonId, totalLessons)
getEnrollment(db, studentId, courseId)
```

---

## Firebase Auth & Role Resolution

### Flow on Login

```
User signs in
    ↓
Check Firestore users/{uid}
    ↓
If uid == CEO_UID or email == "ceo@fusion8.com"  →  role = admin
Else if exists(approved_teachers/{uid})           →  role = teacher, check approved field
Else                                               →  role = student
    ↓
If user doc missing → auto-create (student or admin if CEO)
```

### Auth Hooks

```typescript
const { user, role, approved, isLoading } = useAuth()
const { firestore } = useFirestore()
const { user } = useUser()
```

### Server Actions (Admin SDK)

`src/lib/auth-actions.ts` runs on the server via Next.js Server Actions. Uses `firebase-admin` initialized from `FIREBASE_ADMIN_*` env vars.

```typescript
await signUpUser(email, password, name, role)   // Creates Auth user + Firestore profile
await loginUser(email, password)
await logoutUser()
```

---

## AI Integration (Genkit + Gemini)

Model: **Google Gemini 2.5 Flash**

### Available Flows

| Flow | Input | Output |
|---|---|---|
| `courseContentSummarization` | `{ content: string }` | `{ summary: string }` |
| `generateCourseSummary` | `{ content: string }` | `{ summary: string }` |

### Usage in Server Action

```typescript
// src/lib/actions.ts
const result = await getAiSummaryAction(prevState, lessonContent)
```

---

## Key Design Patterns

- **RBAC via Firestore context** — role resolved once on login, stored in React context
- **CEO hardcoded bypass** — UID and email check in both client provider and Firestore rules
- **Composite enrollment IDs** — `{studentId}_{courseId}` for O(1) enrollment lookups
- **Permission error events** — `errorEmitter` pub/sub surfaces Firestore denials gracefully
- **Mocked payments** — swap `payment-service.ts` for real Fapshi SDK without changing callers
- **Batch notifications** — respects Firestore 500-operation batch limit

---

## Dependencies

| Package | Purpose |
|---|---|
| `next@15.3.8` | Framework |
| `react@18.3.1` | UI library |
| `firebase@11.9.1` | Client SDK (Auth, Firestore, Storage) |
| `firebase-admin` | Server-side Admin SDK |
| `genkit@1.20.0` | AI orchestration |
| `@genkit-ai/google-genai` | Gemini integration |
| `@radix-ui/*` | Accessible UI primitives |
| `react-hook-form + zod` | Forms & validation |
| `recharts` | Analytics charts |
| `zustand` | Lightweight state management |
| `@dnd-kit/*` | Drag-and-drop course builder |
| `embla-carousel-react` | Course carousel |
| `tailwindcss` | Utility-first styling |
