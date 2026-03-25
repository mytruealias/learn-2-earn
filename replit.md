# Learn 2 Earn

## Overview
Learn 2 Earn is a Duolingo-style self-development platform designed for homeless and less fortunate individuals. It offers trauma-informed, low reading-level micro-lessons across essential life skills, financial literacy, survival skills, and personal growth. The platform uses gamification elements like XP, hearts, and streaks to boost engagement. A unique feature allows users to convert earned XP into real money ($1 = 3 XP), which can be redeemed through a payout request system. The project aims to empower vulnerable populations through accessible education and direct financial incentives.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Site Structure
- **`/` (Root)**: B2B partner/investor landing page targeting cities, continuums of care, shelters, outreach orgs, health systems, and funders. Hero: "A Hand Up, Not a Handout" with trust bar proof points. Sections: Platform (3 pillars: Learner Experience, Case Worker/Admin Tools, Incentive System), Impact (engagement, stability, cost reduction, measurable outcomes), Use Cases (4 cards: shelters, outreach, recovery/re-entry, workforce readiness), Demo (video + platform previews + pilot includes), Curriculum (11 paths), Compliance & Reporting, and CTA. Nav: Platform, Impact, Use Cases, Demo, Contact + Book a Demo / Request a Pilot Plan. Secondary link to /app learner experience.
- **`/app`**: The learning platform home — journey cards, skill tree, lessons. Uses cyber/hacker dark theme.
- **`/admin`**: Admin panel for team management, payouts, and audit logs.

### Frontend
- **Framework**: Next.js 15.5.12 with App Router.
- **Landing Page (`/`)**: Enterprise-grade dark theme (#080d14 bg) with glass-morphism cards (backdrop-blur, transparent backgrounds), floating gradient glow orbs in hero, gradient text effects (green→cyan on headline), animated gradient borders on step numbers (blue→purple), generous spacing (7rem sections). Stats use gradient text (white→blue). Cards have top highlight line and hover lift with deep shadows. Pill-shaped section labels with blue tint. CSS in `app/invest/invest.css`. No bottom NavBar shown.
- **Learning App (`/app`)**: Playful dark theme with blue-grey backgrounds (#0f1923 primary, #1a2736 cards), rounded corners (12px radius), green (#58cc02) accents for progress, blue (#3b9eff) primary accent, warm gold (#f5b731), purple (#a78bfa). Colorful gradient card headers (blue→purple→green), pill-shaped stat badges, soft glows. Custom SVG icon library (`app/components/icons.tsx`) replaces emojis throughout.
- **Navigation**: Fixed bottom navigation bar with custom SVG icons (Home→/app, Lifeline, Profile/Join) shown on app pages only. Persistent SOS button (red circle with alert icon) for crisis assistance. Landing page has its own fixed top nav.

### Backend
- **API**: Next.js API routes handle authentication, user progress, and payout functionalities.
- **Demo Access Gate**: Middleware (`middleware.ts`) protects `/app`, `/paths`, `/lesson`, `/profile`, `/lifeline`, and `/signup` routes. Visitors must enter an access code at `/access` to get a `l2e_demo_access` cookie (30-day expiry). Code is set via `DEMO_ACCESS_CODE` env var (default: "LEARN2EARN"). API route: `POST /api/access`.
- **Authentication**: Supports account creation with guest migration, email/password login, and session management.
- **Progress Tracking**: Records lesson completion and awards XP.
- **Payouts**: Manages user requests for XP conversion to cash with an approval workflow.

### Data Management
- **ORM**: Prisma 6.1.0 with PostgreSQL.
- **Database**: PostgreSQL, utilizing Replit's built-in service via `DATABASE_URL`.
- **Data Models**: Key models include `Path`, `Module`, `Lesson`, `Card` for curriculum structure; `User` for profiles and gamification; `Progress` for tracking learning; `PayoutRequest` for financial transactions; `AdminUser` for team management; `AuditLog` for security; and `ConsentRecord` for data privacy.

### Curriculum
- The platform hosts 11 journeys and 139 lessons, covering Life Skills (Stability Basics, Survival & Systems, Building Your Future, Financial Literacy) and Addiction & Recovery (Foundations, Harm Reduction & Safety, Treatment & Recovery Navigation, Relapse Prevention Mastery, Substance-Specific Safety, Supporter & Family Skills).
- Content is trauma-informed and avoids diagnostic or medical advice.

### Gamification & Earnings
- **Gamification**: XP for lesson completion ($1 = 3 XP), a heart system for lesson attempts, streaks, and crown levels.
- **Earnings**: Users can request payouts of their available XP balance.

### Admin Panel
- A separate admin interface `/admin` provides tools for user management, payout approval workflows (pending, reviewed, approved, completed/rejected), and audit log viewing.
- Features role-based access control (admin, caseworker, finance) and comprehensive audit logging for all sensitive actions.

## External Dependencies
- **Database**: PostgreSQL (provided by Replit).
- **Frontend Framework**: Next.js.
- **ORM**: Prisma.
- **Authentication Hashing**: bcrypt.
- **Fonts**: Google Fonts (Share Tech Mono, Rajdhani, Inter).

## Recent Changes
- 2026-02-23: Landing page moved to root (`/`), learning app moved to `/app`
  - Public-facing investor/city-official page is now the homepage at `/`
  - Learning platform moved from `/` to `/app`
  - All internal "back to home" links updated to point to `/app`
  - NavBar home link updated to `/app`; NavBar hidden on landing page
  - Old `/invest` route removed (content now at root)
  - Landing page nav includes "Open App" button linking to `/app`
