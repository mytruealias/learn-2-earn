# Learn 2 Earn

> Trauma-informed micro-learning with real cash incentives — built for people experiencing homelessness or in recovery.

---

## Overview

Learn 2 Earn is a mission-driven platform that rewards learners with small cash incentives for completing bite-sized lessons across life skills, financial literacy, harm reduction, and personal growth. It is designed to meet users where they are — low reading levels, mobile-first, with no prior tech experience required.

The platform has three access layers:

| Layer | Path | Audience |
|---|---|---|
| Investor / Partner landing page | `/` | City officials, funders, continuums of care |
| Learner app | `/app` | Program participants (code-gated) |
| Admin dashboard | `/admin` | Case workers, program managers, finance |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| ORM | [Prisma 6](https://www.prisma.io/) |
| Database | PostgreSQL |
| Styling | CSS Modules + global CSS |
| Auth | Cookie-based sessions, bcrypt |
| Deployment | Any Node.js-compatible host (Vercel, Railway, Render, etc.) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local or hosted)
- `npm` or `pnpm`

### Installation

```bash
git clone https://github.com/mytruealias/learn-2-earn.git
cd learn-2-earn
npm install
```

### Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required variables:

```
DATABASE_URL      PostgreSQL connection string
SESSION_SECRET    Long random string for signing session tokens
DEMO_ACCESS_CODE  Learner app access code (default: LEARN2EARN)
ADMIN_USERNAME    Initial admin account username
ADMIN_PASSWORD    Initial admin account password
```

### Database setup

```bash
# Apply migrations
npx prisma migrate deploy

# Seed curriculum content
npx ts-node prisma/seed.ts

# Seed admin user
npx ts-node prisma/seed-admin.ts
```

### Run in development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Project Structure

```
├── app/
│   ├── page.tsx              # Public landing page (/)
│   ├── app/page.tsx          # Learner dashboard (/app)
│   ├── lesson/[lessonId]/    # Lesson player
│   ├── paths/[pathSlug]/     # Learning path detail
│   ├── admin/                # Admin dashboard
│   ├── api/                  # API routes
│   └── components/           # Shared UI components
├── lib/                      # Server-side utilities
├── prisma/
│   ├── schema.prisma         # Data models
│   ├── migrations/           # Migration history
│   └── seed*.ts              # Seed scripts
├── public/                   # Static assets
└── middleware.ts             # Access gate middleware
```

---

## Curriculum

11 learning journeys — 139 lessons:

**Life Skills**
- Stability Basics
- Survival & Systems
- Building Your Future
- Financial Literacy

**Addiction & Recovery**
- Foundations of Recovery
- Harm Reduction & Safety
- Treatment & Recovery Navigation
- Relapse Prevention Mastery
- Substance-Specific Safety
- Supporter & Family Skills

All content is trauma-informed and written at a 6th-grade reading level.

---

## Incentive System

Learners earn XP for completing lessons. XP converts to cash at a configurable rate (default: $1 = 3 XP). Payout requests flow through an admin approval workflow before disbursement.

---

## Admin Panel

The admin panel (`/admin`) provides:

- **User management** — view accounts, XP balances, enrollment status
- **Payout workflow** — review, approve, or reject payout requests
- **Audit log** — immutable record of all admin actions

Role levels: `admin`, `caseworker`, `finance`.

---

## Running the tests

The project ships with two test suites:

| Suite | Tooling | Scope |
|---|---|---|
| API integration tests | [Vitest](https://vitest.dev/) | Calls Next.js route handlers directly against a real Postgres test DB |
| End-to-end tests | [Playwright](https://playwright.dev/) | Drives the running app in a real browser |

### One-time setup

1. Create a separate, throw-away Postgres database for tests (the URL or name should contain the word `test` — the test runner refuses to wipe a DB that doesn't look like a test DB).
2. Copy the example env file and fill it in:
   ```bash
   cp .env.test.example .env.test
   # edit DATABASE_URL_TEST and any PIN/secret values
   ```

The API test runner resets this database (`prisma db push --force-reset`) at the start of every run, so never point it at your dev or production DB.

### Commands

```bash
npm run test:api        # vitest, single run (default `npm test`)
npm run test:api:watch  # vitest in watch mode
npm run test:e2e        # playwright, requires the dev server (auto-starts via playwright.config.ts)
npm run test:all        # API tests then E2E
```

### What's covered

- `tests/api/auth.test.ts` — register / login / session including duplicate-email, bad password, invalid JSON
- `tests/api/payout.test.ts` — auth gate, supported payment methods, balance + weekly cap, body/session userId mismatch
- `tests/api/progress.test.ts` — XP award, idempotent re-completion, unknown lesson, session mismatch
- `tests/api/admin-login.test.ts` — wrong credentials + audit log writes
- `tests/api/city-access.test.ts` — wrong PIN, correct PIN, per-IP+city lockout after 10 wrong attempts
- `tests/api/access.test.ts` — demo gate code + lockout
- `e2e/admin.spec.ts` — admin dashboard flows (login, payout review, sidebar)
- `e2e/city-pin.spec.ts` — city PIN gate happy path and landing page CTA

---

## Deployment

The app runs on any Node.js host. Ensure the following before deploying to production:

1. `DATABASE_URL` points to a production PostgreSQL instance
2. `SESSION_SECRET` is a strong, unique secret (not shared with dev)
3. `DEMO_ACCESS_CODE` is set to your desired access code
4. Run `npx prisma migrate deploy` after each release
5. Set `ALLOWED_DEV_ORIGINS` to blank (not needed in production)

---

## License

Copyright © 2025 Learn 2 Earn. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
