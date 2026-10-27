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

## Upgrade plan and verified baseline

See the [current architecture and route inventory](docs/current-architecture.md), [staged upgrade checklist](docs/upgrade-plan.md), [baseline evidence](docs/upgrade-baseline.md), and [stage status](docs/upgrade-status.md) before starting improvement work. The baseline records known setup-documentation differences below.

## Design system

[Design conventions and development workshop](docs/design-system/README.md) · [Browser screenshots](docs/design-system/screenshots/README.md) · [Verification and limits](docs/design-system/verification.md). Representative migrations cover learner paths and the staff services directory; remaining routes migrate separately.

## Learner access and onboarding

[Journey, session safety and rollout](docs/learner-journey/README.md) · [Browser evidence](docs/learner-journey/screenshots/README.md). Program invitations lead to minimal signup, two short welcome steps or explicit guest exploration. Identity and guest association come from server sessions. No localStorage flag proves login. Recovery delivery is unconfigured, so `/recover` gives honest staff-assisted instructions and sends nothing. Apply the additive learner-session migration before running this version; see DEPLOYMENT.md. Learn/Practice/Rewards/Profile/Help navigation uses real routes.

## Learning progression

[State/data conventions and rollout](docs/learning-progression/README.md) · [Browser evidence](docs/learning-progression/screenshots/README.md) · [Verification](docs/learning-progression/verification.md). Home prioritizes a real next lesson, optional daily goal and My paths. Visual and linear lesson lists share the same published content and actions; opening a lesson never awards XP. Apply the additive preference/visit migration after the secure-session migration before running this version.

## Lessons and Practice

[Server lesson engine, review rules and rollout](docs/lesson-flow/README.md) · [Card inventory](docs/lesson-flow/card-inventory.md) · [Browser evidence](docs/lesson-flow/screenshots/README.md) · [Verification](docs/lesson-flow/verification.md). Checked answers and position resume across devices. Completion and XP are atomic and derive from server evidence; repeat practice never adds monetary credit. Practice includes missed-question review, topics and explained 1/3/7/14-day scheduling. Daily goals/streaks use a saved timezone, then optional `PROGRAM_TIMEZONE`, then UTC. Apply the additive attempt/review migration before running this version. `npm run audit:cards` validates authored formats without a database; `npm run test:lesson` runs the real browser lesson/practice sequence in an isolated database.

## Reward accounting and manual payments

[Audited rules, ledger and state machine](docs/reward-accounting/README.md) · [Baseline findings](docs/reward-accounting/audit.md) · [Verification and exact files](docs/reward-accounting/verification.md) · [Browser evidence](docs/reward-accounting/screenshots/README.md). Rewards uses one versioned program contract, exact cents and audited XP reservations; approvals are distinct from recorded payments. Financial program assignment is separate from editable contact city. Apply the additive accounting migration and complete the explicit hash-reviewed legacy reconciliation **before enabling financial writes**. No build/start command performs a backfill, sends money or silently repairs history. See DEPLOYMENT.md for gates and rollback restrictions.

## Getting Started

Use Node.js 24 (the CI runtime), npm and PostgreSQL 14+. Retain `package-lock.json`.

```bash
npm ci --include=dev
npm run prisma:generate
cp .env.example .env
```

Fill `.env` privately with `DATABASE_URL`, a strong `SESSION_SECRET`, and your desired `DEMO_ACCESS_CODE`. City proposals use `AUSTIN_ACCESS_PIN` / `CITY_ACCESS_PIN`. Optional AI and Stripe bindings are described in [deployment guidance](DEPLOYMENT.md). Do not commit filled environment files or print credentials.

For a **new local development database only**, set DATABASE_URL to that loopback database, then explicitly confirm its name:

```bash
npm run db:prepare-dev -- --confirm-database your_local_database
npm run release:content -- --confirm-database your_local_database
npm run dev
```

The application binds **0.0.0.0:5000**. `db:prepare-dev` is a non-production, loopback schema push with no reset or data-loss acceptance; it must not replace production migrations. The tracked migrations lack the original initial schema, so a completely fresh production database requires the verified baseline procedure in DEPLOYMENT.md.

### Build and release are separate

```bash
npm run lint
npm run build
npm run typecheck
npm start
```

`build` generates Prisma client and runs Next with an unreachable build-only database binding and provider/bootstrap bindings disabled. It performs no migration, history repair, content synchronization or admin provisioning. Lint/type errors are no longer suppressed during Next build. `start` only starts the built server on 0.0.0.0:5000 using runtime settings.

Database changes require an operator-reviewed target, a tested backup/restore plan, and separate explicit commands:

| Command | Effect |
| --- | --- |
| `npm run release:migrate -- --confirm-database reviewed_database_name` | Apply tracked migrations to a verified existing migration baseline; no seeds/repair |
| `npm run release:content -- --confirm-database reviewed_database_name` | Insert missing curriculum/slots; preserve existing content, IDs, rewards, user progress and payment history |
| `npm run release:bootstrap-admin -- --confirm-database reviewed_database_name` | Create first admin only when **no staff rows exist**; requires `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_DEFAULT_PASSWORD` (16+ characters) supplied securely |
| `npm run recovery:inspect` | Read-only status of the historic init migration; never changes migration history |

Do not set bootstrap variables in ordinary build/start settings; remove them immediately after deliberate first provisioning. Existing staff must be managed through authenticated staff management or a separately reviewed recovery procedure. Content sync does not overwrite existing metadata or rewards; corrections to existing content require an explicit reviewed backfill. No payout-rate change occurs here.

See [the release runbook](DEPLOYMENT.md) for development/deployment settings, migration sequencing, recovery prerequisites and rollback compatibility. Replit's actual configuration is not present in this checkout; verify its selected commands before deploying. No deployment was performed by this change.

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

The seed sources define learning journeys across life skills and recovery. Measure current lesson/card counts from those sources rather than this list or the curriculum snapshot:

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

Learners earn XP for completing lessons. XP converts to cash at a configurable rate (fallback: $0.05 per XP; active program configuration takes precedence). Payout requests flow through an admin approval workflow before disbursement.

---

## Admin Panel

The admin panel (`/admin`) provides:

- **User management** — view accounts, XP balances, enrollment status
- **Payout workflow** — review, approve, or reject payout requests
- **Audit log** — immutable record of all admin actions

Role levels: `admin`, `caseworker`, `finance`.

---

## Running the tests

The harness provisions a **new database and restricted role for each suite** on a local PostgreSQL instance. It never resets a pre-existing application database. Test fixtures and reset commands require matching injected bindings, a random server-side capability marker, verified database ownership and a role without superuser/CREATE DATABASE/CREATE ROLE privileges. A name containing `test` is not enough. Remote database targets and remote/pre-existing HTTP servers are refused.

```bash
cp .env.test.example .env.test
# Privately configure TEST_DATABASE_ADMIN_URL for local /postgres with provisioning permissions.
npx playwright install chromium
npm test
```

`.env.test` supplies only the maintenance connection used to create/drop fresh databases/roles and an optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE` path. It cannot override the child suite's isolated application bindings. No production credentials are required. For a preinstalled browser, export `PLAYWRIGHT_CHROMIUM_EXECUTABLE` with its local executable path. The bundled Playwright browser is the CI default.

| Command | Scope |
| --- | --- |
| `npm run test:unit` | Isolation guard tests; no database needed |
| `npm run test:api` | API integration + release safety tests on a fresh isolated DB |
| `npm run test:api:watch` | Same isolated API database retained only for that watch session |
| `npm run test:e2e` | Existing HTTP city/learner/payout tests; local server port 5050 and `.next-e2e` output |
| `npm run test:browser` | Actual Chromium: responsive public page, learner UI login/path/lesson, staff UI login/dashboard |
| `npm run test:design` | Actual Chromium + axe: design states, real CRUD/progress, keyboard, contrast, reflow and touch targets |
| `npm run test:journey` | Actual Chromium: invitation/signup/login/onboarding/home/logout, signed guest association, expiry and interruption recovery |
| `npm run test:progression` | Actual Chromium: next lesson, both path views, all lesson/program states, selections/goals and navigation without XP |
| `npm test` | Unit → API → HTTP → browser smoke → design → learner journey → progression, sequentially |
| `npm run test:e2e:ui` | Legacy admin browser suite; isolated DB but still needs its explicit legacy role fixtures; not a default CI gate |

The harness drops only the resources it created on exit and preserves suite failure status. Separate invocations use separate random databases. If a machine/process is forcibly killed, remove only verified orphan resources from that run; never point cleanup at the development DB. The legacy suite's fixture/assertion limitations remain recorded in the baseline and are not claimed fixed.

## Deployment

[DEPLOYMENT.md](DEPLOYMENT.md) is the release/recovery runbook. [GitHub CI](.github/workflows/checks.yml) uses an ephemeral PostgreSQL 17 service, fresh restricted suite roles, no repository/production secrets, and independent lint/type/build/test gates. The existing Replit runtime remains the hosting target. A passing CI check does not authorize deployment or prove live Replit settings.

---

## License

Copyright © 2025 Learn 2 Earn. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
