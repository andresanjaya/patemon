# Patemon — Product Requirements Document (PRD)
**Version:** Draft v0.1 for MVP v1 · **Updated:** 2026-11-14 · **Owner:** Product · **Status:** Needs user and ritual-expert validation

## 1. Summary
Patemon is a web-based planning workspace tailored to Hindu Balinese *pawiwahan*, focused on planning ceremonies, banten and materials, family assignments and budget. The service will be commercialized with a one-time payment per wedding workspace, not account resale or permanent shareable activation codes.

## 2. Problem
Couples and extended families currently coordinate ceremonies, ritual equipment and purchases, vendors and budgets across chats, spreadsheets and memory. Generic wedding apps have limited support for Balinese Hindu ceremony variations. Missing or duplicate purchases, unclear responsibility, late preparation, and budget overruns follow.

## 3. Target users & jobs-to-be-done
- **Couple / wedding owner:** understand all planned activities, payments and upcoming tasks in one dashboard.
- **Partner / co-organizer:** share workload and track changes without overwriting each other's work.
- **Family coordinator / PIC:** receive specific responsibilities, quantities and deadlines.
- **Serati banten / religious advisor:** *external validator*, not automatically a paying user; correct which ritual entries apply, including regional variations.
- **Admin:** maintain curated and sourced templates, and investigate payment/access issues.

## 4. Goals / hypotheses
1. Users can build a usable initial wedding plan by answering a short guided onboarding without imposing universal rituals.
2. A couple and at least one family collaborator can coordinate tasks and banten requirements without leaking data to other weddings.
3. Users can view total planned, committed/paid, and remaining budget with no double-counting of package banten and component ingredients.
4. Users can purchase access and receive it automatically after verified successful payment.
5. Ritual information is labeled by region, source and validation status.

**Proposed success criteria (to validate with beta):**
- >= 80% of beta testers can finish onboarding without facilitator assistance.
- >= 70% can create a ceremony plan and at least five checklist items.
- No cross-workspace authorization data leaks in automated tests.
- Successful verified sandbox payment grants exactly one applicable entitlement; failed/expired/refunded payments do not.
- 100% of published curated ritual templates have source and validation metadata.

## 5. MVP v1 scope (functional)
### 5.1 Account and workspace
- Email/Google login via Supabase, user profile, create exactly one or more workspaces (each paid separately).
- Wedding basic info: couple display names, prospective date, location/region, marriage form, planned activities, approximate budget.
- Invite collaborators by link/email and assign roles: owner, editor, viewer; permissions enforced in Postgres RLS and server actions.

### 5.2 Personalized adat template
- Ask whether the wedding follows memadik/ngidih, ngerorod, nyentana, or custom; store choice rather than making authoritative claims.
- Select suggested ceremonies; allow adding, editing, reordering and removing ceremonies.
- Catalog includes banten, sarana ritual, optional constituent ingredients; each item captures local relevance, descriptions, notes, source, review status and revision date.
- A template suggestion may be **common, conditional, or requires validation**. Quantities and pricing are blank until confirmed by user/vendor.
- Never automatically prescribe Dewasa Ayu or ritual correctness.

### 5.3 Planning
- Ceremony list and details: dates, location, person-in-charge, checklist and banten.
- Banten planner: request/owned/ordered/making/ready/not-needed; quantity, unit, source method, assignee and price estimate.
- Generic task manager: category, due date, status, priority, assignee; filter by date/category/PIC.
- Wedding budget: planned/actual/paid/outstanding, payment responsibility and transactions; avoid double counting.
- Vendor list: contact, category, quote, booking status and due payments.
- Guest list (basic): side, household/group, headcount, notes and invitation status; **no automated RSVP/public guest site in v1**.
- Day-of rundown: ordered segments with start/end, location and PIC.
- Dashboard summaries: time to planned wedding date, completion progress, banten readiness, budget and upcoming overdue actions.
- Export CSV of key lists for contingency and archiving.

### 5.4 Monetization
- Public landing/pricing plus limited free preview.
- One-time checkout for access to **one wedding workspace**; exact price, duration and refund policy pending validation.
- Midtrans Snap payment with server-generated checkout, verified webhook signature/status, idempotency and reconciliation.
- Graceful read-only access / data export on entitlement expiry (final policy needs product/legal review).
- Invitation/access is associated with authenticated user membership, not a reusable shared purchase code.

### 5.5 Content management
- MVP: curated data seeded from versioned CSV/migrations and managed by admin through a controlled workflow. Full CMS is out of scope.
- Template fields: id, type, name, aliases, description, region applicability, ceremonial applicability, requirements classification, source citation/URL, validated_by, validation_date, revision/version, active flag.

## 6. Screens and key flows
1. Landing → pricing → sign in
2. Onboarding → workspace setup → select suggested ceremonies → review/edit plan
3. Overview dashboard → urgent tasks, next ceremonies, budget and banten status
4. Ceremonies → ceremony detail → linked tasks, banten and PIC
5. Banten & Sarana → item detail → acquisition progress, quantity, budget
6. Tasks → list / details / filter
7. Budget → grouped summary → line items → payments
8. Vendors → vendor detail → agreement and due payments
9. Guests → list / counts / export
10. Rundown → day-of segments / PIC
11. Members → invite and permission management
12. Account / workspace / license management → checkout and status

## 7. Proposed data entities
`profiles`, `weddings`, `wedding_members`, `ceremony_templates`, `ritual_catalog`, `ceremony_ritual_template_links`, `wedding_ceremonies`, `wedding_ritual_items`, `wedding_tasks`, `budget_items`, `budget_payments`, `vendors`, `guests`, `rundown_events`, `checkout_orders`, `payment_events`, `access_grants`, `activity_logs`.
All wedding-scoped tables reference `wedding_id`; RLS policies derive authorization from memberships and server-enforced payment/access decisions.

## 8. Technical constraints
- Stack: Next.js + TypeScript, Supabase Postgres/Auth/Storage, Midtrans, Vercel.
- UTC storage with Asia/Makassar-aware display and daylight date semantics.
- Money stored as integer IDR (not floating point). Payment state is source-of-truth from verified provider events.
- Accessibility: keyboard navigation, semantic form labels, contrast, readable mobile typography and clear validation.
- Secure admin/service-role credentials must never be delivered to browser code.
- Standard staging/production separation with migrations and environment secrets.

## 9. Non-functional requirements / DoD
- Responsive layouts from small mobile to desktop.
- Unit/integration/E2E tests for critical flows and regression, including unauthorized requests.
- Audit trail for key user changes and access events.
- Basic analytics and error monitoring with privacy considerations.
- Backups and incident response runbook; privacy policy, terms, cookie-consent strategy as applicable.
- Automated CI checks and manual UAT by target couples and at least one local ritual expert.

## 10. Key risks and guardrails
- **Regional/religious variance:** never present templates as universal mandatory procedure. Make all suggested items editable and clearly labeled.
- **Unvalidated content:** source and review flags; withhold “verified” status until expert review.
- **Cost estimates:** no invented fixed banten prices or quantities.
- **Payments:** verified callbacks only; enforce idempotency and reconciliation, support refunds/chargebacks.
- **Sensitive data:** minimize guest data; retention, delete/export and role-based permissions.

## 11. Out of scope for v1
AI wedding assistant; automatic Auspicious-Day/Dewasa Ayu calculator; complete regional rule engine; guest RSVP microsite/invitations; vendor marketplace/booking; accounting integration; native mobile apps; WO subscription and multi-customer organization dashboard.

## 12. Dependencies / open decisions
- Confirm trademark/domain of Patemon.
- Pricing test, paid entitlement window, after-expiry export/read-only policy and refund process.
- Validate ceremonial variants and actual banten requirements with qualified local practitioners from more than one region.
- Choose seller entity and payment merchant account; review applicable tax, legal, and privacy obligations.
- Confirm full feature priorities after early user interviews.

## 13. Release definition
MVP v1 is releasable when all P0 tickets pass QA, zero known critical authorization/payment defects remain, ritual seed data is labeled as reviewed vs unreviewed, the staging/prod payment flow is verified, and beta feedback has been triaged.
