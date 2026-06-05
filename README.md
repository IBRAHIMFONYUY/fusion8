# Fusion8 — Incubation · Acceleration · Production Lab

Cameroon's end-to-end hardware innovation platform. Students learn engineering fundamentals, build real hardware prototypes in our Yaoundé production lab, and launch as entrepreneurs.

**Stack:** Next.js 15 · Firebase · Genkit AI · Tailwind CSS  
**Firebase Project:** `fusion81-77505965-97563`  
**Location:** Bamenda, Cameroon  
**Focus:** Hardware-first (Robotics, Arduino, IoT, Embedded Systems) + Software Solutions + Entrepreneurship

---

## Repository Structure

```
fusion8/
├── frontend/                 Next.js 15 web application
│   ├── src/
│   │   ├── app/              Pages & routes (App Router)
│   │   ├── components/       UI components
│   │   ├── services/         Firestore service layer
│   │   ├── firebase/         Firebase client & admin setup
│   │   ├── ai/               Genkit AI flows
│   │   ├── hooks/            Custom React hooks
│   │   ├── lib/              Auth actions & utilities
│   │   └── types/            TypeScript interfaces
│   ├── package.json
│   └── .env                  Environment variables
│
├── backend/                  Firebase backend
│   ├── functions/            Cloud Functions (Node 24 + Genkit)
│   ├── dataconnect/          Firebase Data Connect schema (PostgreSQL)
│   ├── firestore.rules       Firestore security rules
│   ├── firestore.indexes.json Compound query indexes
│   ├── firebase.json         Firebase project config
│   └── apphosting.yaml       Firebase App Hosting config
│
├── docs/                     Architecture & specification documents
├── scripts/                  Admin utility scripts
├── fusion8.code-workspace    VS Code workspace (open this)
└── package.json              Root convenience scripts
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project already configured: `fusion81-77505965-97563`

### Run Locally

```bash
# Frontend
cd frontend
npm install
npm run dev
# → http://localhost:9002

# Deploy backend (from root)
npm run backend:rules       # Deploy Firestore rules only
npm run backend:functions   # Deploy Cloud Functions only
npm run backend:deploy      # Deploy everything
```

### VS Code Setup

Open `fusion8.code-workspace` — this configures correct TypeScript paths and IntelliSense for both `frontend/` and `backend/` as named workspace folders.

---

## Environment Variables (`frontend/.env`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client SDK key |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `FIREBASE_ADMIN_PROJECT_ID` | Admin SDK — project ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Admin SDK — service account email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Admin SDK — full service account JSON accepted |
| `GEMINI_API_KEY` | Google Gemini (Genkit AI flows) |

---

## User Roles

| Role | Description |
|---|---|
| `student` | Default role. Access to courses, assignments, projects, live sessions |
| `teacher` | Requires admin approval. Creates courses, grades submissions, hosts live sessions |
| `admin` | Full platform access. User management, cohort admissions, analytics |

**CEO Override:** UID `x8rM4ioT6jTMU0rEfy2ujMQ0sFy1` or email `ceo@fusion8.com` bypasses all Firestore security rules and is auto-promoted to admin in the client.

---

## Innovation Pipeline

```
LEARN  →  BUILD  →  LAUNCH
  ↓          ↓         ↓
Courses   Production  Entrepreneur
Online +  Lab (Yaounde) Support
Onsite    Robotics/IoT  Investors
```

---

## Payments

MTN Mobile Money via **Fapshi**. Currently **mocked** for development — 3-second simulated delay, always succeeds, generates `FAP-{random}` reference. See `frontend/src/services/payment-service.ts` to integrate live Fapshi SDK.

---

## Contact

- **Support:** support@fusion8.com
- **WhatsApp:** +237 680 548 673
- **Location:** Bamenda , Cameroon
