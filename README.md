# Dossier

A white-labeled client portal SaaS platform for freelancers and small agencies.
Consolidates client management — project tracking, file delivery, invoicing, and
communication — into a single branded experience.

> **Live Demo**: https://dossier-delta-gold.vercel.app  
> **Vercel Team ID**: `nobelchm-6842's projects`  
> **AWS Database**: Amazon RDS PostgreSQL  

## Stack

- **Framework**: Next.js 15 (App Router) deployed on Vercel
- **Database**: Amazon RDS PostgreSQL (AWS)
- **ORM**: Prisma (type-safe, with migrations)
- **Auth**: NextAuth.js v5 (OTP + Google OAuth + magic link)
- **UI**: Tailwind CSS + shadcn/ui
- **File storage**: Amazon S3 (presigned upload + signed download)
- **Email**: Resend (transactional)
- **Payments**: Stripe (invoicing + subscriptions)
- **AI**: Anthropic Claude (project update summaries)
- **Multi-tenancy**: App-level `organizationId` scoping on all queries

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL (Edge)                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Next.js 15 App Router                         │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐   │  │
│  │  │  Provider    │  │   Client     │  │   API Routes   │   │  │
│  │  │  Dashboard   │  │   Portal     │  │  (webhooks)    │   │  │
│  │  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘   │  │
│  │         │                  │                   │            │  │
│  │  ┌──────┴──────────────────┴───────────────────┴────────┐  │  │
│  │  │           Server Actions + Middleware                 │  │  │
│  │  │        (Auth, Role-routing, Permissions)              │  │  │
│  │  └──────────────────────┬────────────────────────────────┘  │  │
│  └─────────────────────────┼─────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────────┐
          │                  │                      │
          ▼                  ▼                      ▼
┌──────────────────┐ ┌─────────────────┐  ┌─────────────────┐
│  Amazon RDS      │ │   Amazon S3     │  │   Stripe API    │
│  PostgreSQL      │ │   (File Store)  │  │   (Payments)    │
│                  │ │                  │  │                  │
│  - Organizations │ │  - Deliverables │  │  - Subscriptions │
│  - Users/Clients │ │  - Uploads      │  │  - Invoices      │
│  - Projects      │ │  - Signed URLs  │  │  - Webhooks      │
│  - Milestones    │ │                  │  │                  │
│  - Deliverables  │ └─────────────────┘  └─────────────────┘
│  - Invoices      │
│  - Messages      │          ┌─────────────────┐
│  - Activity Logs │          │  Anthropic API  │
└──────────────────┘          │  (Claude)       │
                              │                  │
                              │  - AI Summaries  │
                              │  - Client Updates│
                              └─────────────────┘

                              ┌─────────────────┐
                              │   Resend API    │
                              │   (Email)       │
                              │                  │
                              │  - OTP Codes    │
                              │  - Invitations  │
                              └─────────────────┘
```

### How it connects

1. **Vercel** hosts the Next.js app with edge middleware for auth/routing
2. **Amazon RDS PostgreSQL** stores all application data (15 models) — connected via Prisma ORM
3. **Amazon S3** handles file uploads/downloads with presigned URLs for security
4. **Stripe** processes subscription billing and invoice payments via webhooks
5. **Anthropic Claude** generates AI-powered project summaries from real milestone data
6. **Resend** sends transactional emails (OTP verification, client portal invitations)

### Data Flow

- Provider signs up → org created in **RDS** → onboarding wizard
- Provider adds client → stored in **RDS** → invite email via **Resend**
- Provider uploads deliverable → file to **S3** → metadata to **RDS**
- Client views portal → auth via **NextAuth** → data from **RDS** → files from **S3**
- Provider generates update → milestone data from **RDS** → summarized by **Claude**
- Client pays invoice → **Stripe** processes → webhook updates **RDS**

## Subdomain Routing

Two interfaces share one Next.js deployment:

- `app.dossier.dev` — provider dashboard (clients, projects, invoices, settings)
- `{slug}.dossier.app` — branded client portal (project status, approvals, payments)

Subdomain routing is handled in `middleware.ts`. Tenant isolation is enforced via
`organizationId` on every Prisma query, guarded by `requireRole` and
`assertProjectAccess` in `lib/permissions.ts`.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in the following:

```env
# Amazon RDS PostgreSQL
DATABASE_URL=

# Auth
AUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# Resend (email)
RESEND_API_KEY=
EMAIL_FROM=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_AGENCY_PRICE_ID=
STRIPE_ENTERPRISE_PRICE_ID=

# Anthropic
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PORTAL_DOMAIN=dossier.app
```

### 3. Run database migrations

```bash
npx prisma migrate dev
```

### 4. (Optional) Seed demo data

```bash
npm run db:seed
```

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key Commands

```bash
npm run dev          # Start dev server
npm run build        # Type-check + production build
npx prisma studio    # Browse database
npx prisma migrate dev --name <name>  # Create and apply migration
```

## Project Structure
## Subscription Tiers

| Tier       | Description                        |
|------------|------------------------------------|
| FREE       | Default on signup                  |
| PRO        | Unlimited projects, custom branding|
| AGENCY     | Unlimited seats                    |
| ENTERPRISE | Priority support, white-label      |

## Hackathon Submission

| Requirement | Details |
|---|---|
| **AWS Database** | Amazon RDS PostgreSQL |
| **Vercel Project** | https://dossier-delta-gold.vercel.app |
| **Vercel Team ID** | nobelchm-6842's projects |
| **GitHub Repo** | https://github.com/nobelchowdary/dossier |

## License

Private — all rights reserved.
