# Dossier

A white-labeled client portal SaaS platform for freelancers and small agencies.
Consolidates client management — project tracking, file delivery, invoicing, and
communication — into a single branded experience.

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

## Architecture

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

## License

Private — all rights reserved.
