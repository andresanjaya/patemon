# Patemon — Bali Hindu Wedding Planner

Patemon is a mobile-first wedding planning workspace for Balinese Hindu couples and families. It helps organize _pawiwahan_ ceremonies, banten and ritual materials, tasks, budget, vendors, guests, and the day-of rundown in one shared space.

> **Status:** MVP v1 Development · Phase 03 Foundation ([Issue #13](https://github.com/andresanjaya/patemon/issues/13)). Ritual names, sequences, quantities and requirements are **reference data pending local validation**, not universal religious instructions.

## Product principles

1. **Desa, kala, patra first:** requirements vary by area, family, tradition, marriage form, and officiant. No forced one-size-fits-all checklist.
2. **One wedding, multiple people:** a paid wedding workspace can invite authorized family members.
3. **Traceable ritual content:** source, region, review status, and revision date are kept for each catalog item.
4. **Accessible and mobile first:** optimized for coordination on phones and readable by family members.
5. **Privacy by design:** strict per-wedding database isolation, least-privilege roles, and payment verification on the server.

## Tech stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript (Strict mode)
- **Styling:** Tailwind CSS v4 & shadcn/ui
- **Package Manager:** pnpm
- **Code Quality:** ESLint & Prettier
- **Backend & Database (Upcoming):** Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- **Payments (Upcoming):** Midtrans Snap (Server-verified webhook)

## Getting started

### Prerequisites

- Node.js >= 20.x (tested on v22.23.3)
- pnpm >= 10.x (tested on v10.33.0)

### 1. Clone & install dependencies

```bash
git clone https://github.com/andresanjaya/patemon.git
cd patemon
pnpm install
```

### 2. Configure environment variables

Copy the template to your local environment file:

```bash
cp .env.example .env.local
```

> Note: Never commit `.env.local` or any production secrets to version control.

### 3. Run development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Available scripts

- `pnpm dev` — Start the local Next.js development server
- `pnpm build` — Build the application for production
- `pnpm start` — Start the production server
- `pnpm test` — Run automated unit and authorization tests with Vitest
- `pnpm lint` — Run ESLint check
- `pnpm lint:fix` — Run ESLint check and fix auto-fixable issues
- `pnpm typecheck` — Run TypeScript compiler check without emitting files (`tsc --noEmit`)
- `pnpm format:check` — Verify code formatting with Prettier
- `pnpm format` — Format all files with Prettier

## Project structure

```
patemon/
├── .github/                # CI/CD automation workflows
│   └── workflows/
│       └── ci.yml
├── docs/                   # PRD, database schema, security, and deployment documentation
│   ├── PRD-MVP-v1.md
│   ├── DATABASE-SCHEMA.md
│   ├── AUTH-AND-RLS.md
│   └── DEPLOYMENT-AND-OPERATIONS.md
├── supabase/               # Supabase configuration and PostgreSQL migrations
│   ├── migrations/
│   │   ├── 20261114000001_initial_schema.sql
│   │   └── 20261114000002_auth_and_rls.sql
│   └── config.toml
├── tests/                  # Automated unit, authorization, and observability tests
│   ├── auth-rls.test.ts
│   └── observability.test.ts
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/         # Authentication route group (login, register)
│   │   ├── (dashboard)/    # Workspace dashboard route group
│   │   ├── globals.css     # Tailwind CSS styles and theme tokens
│   │   ├── layout.tsx      # Root layout (Navbar, Footer, Fonts)
│   │   └── page.tsx        # Responsive landing page shell
│   ├── components/
│   │   ├── layout/         # Shell layouts (Navbar, Footer)
│   │   └── ui/             # Reusable UI primitives (Button, Card, Badge)
│   ├── features/           # Modular domain logic
│   │   ├── auth/           # Identity & roles
│   │   ├── banten/         # Banten and sarana items
│   │   ├── budget/         # Budget line items (integer IDR)
│   │   ├── ceremonies/     # Ritual and ceremonial flows
│   │   ├── payments/       # Midtrans orders and access grants
│   │   └── workspaces/     # Wedding workspace isolation
│   ├── lib/                # Utilities (cn, helpers)
│   └── types/              # Shared TypeScript definitions
├── .env.example            # Environment variables template
├── components.json         # shadcn/ui configuration
└── package.json            # Project dependencies & scripts
```

## Documentation & Backlog

- [Product Requirements Document — MVP v1](docs/PRD-MVP-v1.md)
- [Database Schema & Migration Guide](docs/DATABASE-SCHEMA.md)
- [Authentication & Row Level Security (RLS) Guide](docs/AUTH-AND-RLS.md)
- [Deployment, CI/CD & Observability Guide](docs/DEPLOYMENT-AND-OPERATIONS.md)
- [Issue Backlog](https://github.com/andresanjaya/patemon/issues)
- [Project Board #8](https://github.com/users/andresanjaya/projects/8/views/2)

## Safety note

This product does not determine mandatory ceremonies or spiritually authoritative offerings. Confirm the final plan with family, serati banten, pemangku/sulinggih, and relevant local customary authorities.
