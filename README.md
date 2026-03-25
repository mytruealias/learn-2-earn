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
