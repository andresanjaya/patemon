# Patemon — Bali Hindu Wedding Planner

Patemon is a mobile-first wedding planning workspace for Balinese Hindu couples and families. It helps organize *pawiwahan* ceremonies, banten and ritual materials, tasks, budget, vendors, guests, and the day-of rundown in one shared space.

> **Status:** Product discovery and MVP v1 planning. Ritual names, sequences, quantities and requirements are **reference data pending local validation**, not universal religious instructions.

## Product principles
1. **Desa, kala, patra first:** requirements vary by area, family, tradition, marriage form, and officiant. No forced one-size-fits-all checklist.
2. **One wedding, multiple people:** a paid wedding workspace can invite authorized family members.
3. **Traceable ritual content:** source, region, review status, and revision date are kept for each catalog item.
4. **Accessible and mobile first:** optimized for coordination on phones and readable by family members.
5. **Privacy by design:** strict per-wedding database isolation, least-privilege roles, and payment verification on the server.

## Proposed stack
- Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Supabase (Postgres, Auth, Storage, Row Level Security)
- Midtrans (Snap + verified server-side webhook)
- Vercel, Zod, React Hook Form, automated testing and CI

## Documentation
- [Product Requirements Document — MVP v1](docs/PRD-MVP-v1.md)
- [Issue backlog](https://github.com/andresanjaya/patemon/issues)
- [Project board #8](https://github.com/users/andresanjaya/projects/8/views/2)

## Initial MVP modules
Account & workspace · Ritual template onboarding · Ceremonies · Banten & sarana · Checklist & timeline · Budget & payments · Vendors · Guests · Rundown · Family collaboration · Checkout & premium access · Export & production readiness.

## Explicitly out of MVP v1
Automatic Dewasa Ayu computation, religious advice as a substitute for local officiants, AI chat, vendor marketplace/booking, full RSVP/QR invitations, WO multi-client billing, mobile native apps.

**Safety note:** This product does not determine mandatory ceremonies or spiritually authoritative offerings. Confirm the final plan with family, serati banten, pemangku/sulinggih, and relevant local customary authorities.
