# Fusion8 — Backend

Firebase backend for the Fusion8 platform. Manages security rules, Cloud Functions triggers, and Firestore configuration.

**Firebase Project:** `fusion81-77505965-97563`  
**Region:** `us-east4`  
**Functions Runtime:** Node.js 24

---

## Getting Started

```bash
# Install Firebase CLI globally (once)
npm install -g firebase-tools
firebase login

# Install function dependencies
cd functions && npm install && cd ..

# Deploy everything
firebase deploy

# Deploy selectively
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only functions
```

---

## Structure

```
backend/
├── functions/
│   ├── src/
│   │   ├── index.ts          Cloud Function triggers
│   │   └── genkit-sample.ts  Genkit sample (reference only)
│   └── package.json          Node 24 + firebase-functions + Genkit
│
├── dataconnect/              Firebase Data Connect (PostgreSQL bridge)
│   ├── dataconnect.yaml      Service config (us-east4, fdcdb database)
│   ├── schema/schema.gql     GraphQL schema
│   └── example/              Sample queries, mutations, connector config
│
├── firestore.rules           Firestore security rules
├── firestore.indexes.json    Compound query indexes
├── firebase.json             Firebase project deployment config
├── .firebaserc               Project alias mapping
├── apphosting.yaml           Firebase App Hosting (Next.js frontend)
└── service-account.json      Admin SDK credentials (never commit)
```

---

## Cloud Functions (`functions/src/index.ts`)

Three Firestore-triggered functions handle cross-collection consistency and notifications.

### `onEnrollmentCreated`

**Trigger:** `enrollments/{enrollmentId}` — on create  
**Action:** Increments `courses/{courseId}.enrolledCount` using a Firestore transaction

```
New enrollment created
    ↓
Parse courseId from enrollmentId (format: {studentId}_{courseId})
    ↓
Transaction: courses/{courseId}.enrolledCount += 1
```

### `onLessonCreated`

**Trigger:** `courses/{courseId}/lessons/{lessonId}` — on create  
**Action:** Notifies all students enrolled in the course

```
New lesson added to course
    ↓
Query enrollments WHERE courseId == courseId AND status == 'active'
    ↓
Batch write notifications to each enrolled student:
  "New lesson added: {lesson.title}"
```

### `onSubmissionUpdated`

**Trigger:** `submissions/{submissionId}` — on update  
**Action:** Notifies student when their submission is graded

```
Submission document updated
    ↓
Check if grade field changed (before vs after)
    ↓
If graded: write notification to submissions[].studentId:
  "Your assignment has been graded. Score: {grade}"
```

---

## Firestore Security Rules (`firestore.rules`)

### Authority Helpers

```javascript
isMasterAdmin()       // UID == CEO_UID or email == "ceo@fusion8.com"
isAdmin()             // isMasterAdmin() OR exists(roles_admin/{uid})
isApprovedTeacher()   // isAdmin() OR exists(approved_teachers/{uid})
isOwner(userId)       // auth.uid == userId
isSignedIn()          // auth != null
```

**CEO credentials:**
- UID: `x8rM4ioT6jTMU0rEfy2ujMQ0sFy1`
- Email: `ceo@fusion8.com`

### Global Override

```javascript
match /{allPaths=**} {
  allow read, write: if isMasterAdmin();
}
```

Master admin bypasses all rules recursively.

### Collection Rules

#### `users/{userId}`
| Operation | Allowed |
|---|---|
| read | Owner or admin |
| create | Owner only |
| update | Admin, or owner (cannot change own role) |

#### `roles_admin/{uid}`
| Operation | Allowed |
|---|---|
| read | Any signed-in user |
| write | Master admin only |

#### `approved_teachers/{uid}`
| Operation | Allowed |
|---|---|
| read | Any signed-in user |
| write | Admin only |

#### `teacher_applications/{appId}`
| Operation | Allowed |
|---|---|
| create | Anyone (unauthenticated allowed) |
| read, update, delete | Admin only |

#### `news_updates/{docId}` · `approved_teacher_emails/{docId}`
| Operation | Allowed |
|---|---|
| read | Anyone (public) |
| write | Admin only |

#### `courses/{courseId}`
| Operation | Allowed |
|---|---|
| read | Published (public) · Owner teacher · Admin · Enrolled student |
| create | Approved teacher (must set own teacherId) |
| update | Admin or owner teacher |
| delete | Admin only |

Nested `modules/{mId}` and `lessons/{lId}` — anyone can read, approved teacher/admin can write.

#### `broadcasts/{broadcastId}`
| Operation | Allowed |
|---|---|
| read | Any signed-in user |
| create | Approved teacher or admin |
| update/delete | Admin or broadcast owner |

#### `assignments/{assignmentId}`
| Operation | Allowed |
|---|---|
| read | Any signed-in user |
| write | Approved teacher or admin |

#### `enrollments/{enrollmentId}`

Document ID format: `{studentId}_{courseId}`

| Operation | Allowed |
|---|---|
| create | Signed-in user (must set own studentId) |
| read | Admin · Own enrollment or non-existent doc · Approved teacher |
| update | Admin or enrollment owner |

> **Rule note:** `resource == null` check is required for enrollment status checks when the student is not yet enrolled. Without it, the rule crashes when `resource.data` is accessed on a missing document.

#### `submissions/{submissionId}`
| Operation | Allowed |
|---|---|
| create | Signed-in student (must set own studentId) |
| read | Admin · Own submission · Own teacher |
| update | Admin or submission's teacher |

#### `cohort_applications/{appId}`
| Operation | Allowed |
|---|---|
| create | Anyone (public application) |
| read, update, delete | Admin or applicant (self) |

#### `notifications/{notificationId}`
| Operation | Allowed |
|---|---|
| read | Master admin · Admin · Own notification · Global notifications |
| create | Master admin · Admin · Approved teacher |
| delete | Master admin · Admin · Own notification owner |

#### `projects/{projectId}`
| Operation | Allowed |
|---|---|
| read | Anyone (public) |
| create | Any signed-in user |
| update | Admin · Project lead · Team member |

---

## Firestore Indexes (`firestore.indexes.json`)

Two composite indexes for the `notifications` collection:

| Collection | Fields | Purpose |
|---|---|---|
| `notifications` | `global ASC, createdAt DESC` | Query global/broadcast notifications |
| `notifications` | `userId ASC, createdAt DESC` | Query per-user notification feed |

---

## Data Connect (`dataconnect/`)

Firebase Data Connect bridges Firestore with a PostgreSQL database.

**Config (`dataconnect.yaml`):**
- Service ID: `studio`
- Region: `us-east4`
- Database: `fdcdb` (Cloud SQL instance: `studio-fdc`)

**Current status:** Example/template schema (movie review app). Not yet integrated into the main Fusion8 application. The GraphQL schema (`schema/schema.gql`) defines `User`, `Movie`, `MovieMetadata`, and `Review` tables as reference examples.

**To extend:** Update `schema/schema.gql` with Fusion8 domain models (courses, projects, enrollments) and regenerate the SDK.

---

## Firebase App Hosting (`apphosting.yaml`)

```yaml
runConfig:
  maxInstances: 1
```

Configures the Next.js frontend deployment on Firebase App Hosting. Increase `maxInstances` to handle production traffic spikes.

---

## Firebase Project Config (`firebase.json`)

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

Extend this file to add `hosting`, `functions`, or `storage` deployment targets as needed.

---

## Firestore Collections Reference

| Collection | Documents | Key Fields |
|---|---|---|
| `users` | One per user | `uid, email, displayName, role, approved, photoURL` |
| `roles_admin` | One per admin | `uid` (document ID) |
| `approved_teachers` | One per approved teacher | `uid` (document ID) |
| `approved_teacher_emails` | Teacher email allowlist | `email` |
| `teacher_applications` | Pending applications | `name, email, expertise, status` |
| `courses` | One per course | `title, teacherId, status, enrolledCount, price, thumbnail` |
| `courses/{id}/modules` | Modules per course | `title, order, lessons[]` |
| `courses/{id}/lessons` | Lessons per module | `title, videoUrl, content, moduleId` |
| `enrollments` | `{studentId}_{courseId}` | `studentId, courseId, status, paymentReference, progress` |
| `submissions` | One per assignment per student | `studentId, teacherId, courseId, assignmentId, grade, feedback` |
| `assignments` | One per assignment | `title, courseId, dueDate, description` |
| `broadcasts` | Live sessions | `teacherId, title, streamUrl, startTime, status` |
| `notifications` | One per notification | `userId, title, body, global, createdAt, read` |
| `projects` | One per project | `title, studentLeadId, members, status, category, skillsNeeded` |
| `cohort_applications` | Cohort applicants | `studentId, name, email, motivation, status, matriculeId` |
| `news_updates` | Platform announcements | `title, content, createdAt` |

---

## Deployment Checklist

Before going live:

- [ ] Replace mocked Fapshi payment in `frontend/src/services/payment-service.ts`
- [ ] Set `GEMINI_API_KEY` in production environment
- [ ] Rotate `FIREBASE_ADMIN_PRIVATE_KEY` and remove `service-account.json` from repo
- [ ] Increase `apphosting.yaml` `maxInstances` for expected traffic
- [ ] Enable Firebase App Check for API abuse prevention
- [ ] Set up Firebase Alerts & Budget Notifications
- [ ] Enable Firestore backups in Firebase Console
- [ ] Review and tighten Firestore rules before public launch
- [ ] Deploy all Firestore indexes before launch (indexes build asynchronously)
