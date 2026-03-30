# Deployment Guide — Subdomain Routing (Option A)

This guide covers everything needed to go live with three separate subdomains
all served from a single Learn2Earn deployment.

---

## How it works

The same Next.js app answers for all three domains. A `ROOT_DOMAIN` environment
variable activates subdomain-aware routing in the middleware. When unset (local
dev or Replit preview), every route is accessible as normal — no change to your
development workflow.

| Domain | Serves |
|---|---|
| `learn2earn.org` | Investor / partner landing page (`/`) |
| `app.learn2earn.org` | Learner app (`/app`, `/paths`, `/lesson`, etc.) |
| `admin.learn2earn.org` | Admin portal (`/admin/*`) |
| `www.learn2earn.org` | Redirects to `learn2earn.org` |

Cross-domain requests are redirected automatically (301). For example:
- `learn2earn.org/app` → `app.learn2earn.org/app`
- `app.learn2earn.org/admin` → `admin.learn2earn.org/admin`
- `admin.learn2earn.org/` → `admin.learn2earn.org/admin`

---

## Step 1 — Set the ROOT_DOMAIN environment variable

In Replit Deployments → Secrets (or your hosting provider's env config), add:

```
ROOT_DOMAIN=learn2earn.org
```

> Do NOT include `https://` or a trailing slash. Just the bare domain.

---

## Step 2 — Deploy the app

Deploy as normal via Replit Deployments. Note the `.replit.app` deployment
domain (e.g. `learn2earn-abc123.replit.app`) — you will need it for DNS.

---

## Step 3 — Register your domain

Purchase `learn2earn.org` (or your chosen domain) from any registrar:
Namecheap, Google Domains, Cloudflare Registrar, GoDaddy, etc.

---

## Step 4 — Add DNS records

In your DNS provider, create the following records. Replace
`your-deployment.replit.app` with your actual Replit deployment domain.

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `@` (or blank) | `your-deployment.replit.app` | 3600 |
| CNAME | `www` | `your-deployment.replit.app` | 3600 |
| CNAME | `app` | `your-deployment.replit.app` | 3600 |
| CNAME | `admin` | `your-deployment.replit.app` | 3600 |

> Some registrars do not allow a CNAME on the root (`@`). If that is the case,
> use an **ALIAS** or **ANAME** record instead (Cloudflare calls it a "Proxied
> A/AAAA record" — enable the orange cloud proxy).

> DNS propagation typically takes 5–30 minutes but can take up to 48 hours.

---

## Step 5 — Add custom domains in Replit

1. Open your deployment in the Replit dashboard.
2. Go to **Settings → Custom Domains**.
3. Add all four domains, one at a time:
   - `learn2earn.org`
   - `www.learn2earn.org`
   - `app.learn2earn.org`
   - `admin.learn2earn.org`
4. Replit will verify DNS and provision TLS certificates automatically.

---

## Step 6 — Verify

Once DNS has propagated and Replit has issued certificates, test each domain:

```
https://learn2earn.org            → landing page
https://www.learn2earn.org        → redirects to https://learn2earn.org
https://app.learn2earn.org        → redirects to /app (access gate)
https://app.learn2earn.org/admin  → redirects to admin.learn2earn.org/admin
https://admin.learn2earn.org      → redirects to /admin (login)
https://admin.learn2earn.org/app  → redirects to app.learn2earn.org/app
```

> **Important — 301 redirect caching:** All cross-domain redirects use HTTP 301
> (permanent). Browsers cache 301 redirects aggressively. During initial rollout
> or if you need to change routing rules, test in an incognito/private window or
> clear browser cache. Staff using the admin portal should also clear their cache
> if they ever accessed the admin at the old URL.

---

## Cookie isolation

When `ROOT_DOMAIN` is set:

- The admin session cookie (`admin_session`) is scoped to `admin.learn2earn.org`
  — it is never sent to `app.learn2earn.org` or `learn2earn.org`.
- The learner access cookie (`l2e_demo_access`) is scoped to `app.learn2earn.org`
  — it is never sent to `admin.learn2earn.org` or `learn2earn.org`.

This means if a learner's session were ever compromised, it could not be used
to access the admin portal.

---

## Environment variables reference

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `ROOT_DOMAIN` | Production only | `learn2earn.org` | Activates subdomain routing |
| `DATABASE_URL` | Yes | `postgresql://...` | Prisma / PostgreSQL connection |
| `SESSION_SECRET` | Yes | 64-char random string | JWT signing for admin sessions |
| `DEMO_ACCESS_CODE` | Yes | `LEARN2EARN` | Access gate code for learner app |
| `STRIPE_SECRET_KEY` | Optional | `sk_live_...` | Finance pool Stripe integration |

---

## Rollback

To disable subdomain routing at any time, simply remove or unset `ROOT_DOMAIN`
from your deployment environment variables and redeploy. All routes will
immediately become accessible from any domain again.
