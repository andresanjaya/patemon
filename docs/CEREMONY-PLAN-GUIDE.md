# Guided Ceremony Onboarding & Editable Plan Guide

Patemon implements an interactive, culturally respectful onboarding flow for planning Balinese Hindu wedding (*pawiwahan*) ceremonies in accordance with PRD MVP v1 Section 5.2.

---

## 1. Cultural Guardrails & Non-Dogmatic Design

1. **Customary Diversity (Desa, Kala, Patra & Kula Dresta):**
   - Balinese weddings vary significantly across regencies (e.g., Badung, Gianyar, Karangasem, Buleleng) and clan lineages.
   - The onboarding engine **never prescribes dogmatic rules**. It suggests a proven, canonical sequence derived from PHDI guidance and traditional literature, but leaves every item editable, reorderable, or skippable.

2. **Confirmation Warnings on Conditional Rites:**
   - Certain processes (such as *Madengen-dengen / Tegen-tegenan*, *Mepegat Pesapat*, or *Mejauman*) vary by family agreement or marriage form (*memadik*, *ngerorod*, or *nyentana*).
   - These are visually marked with amber alerts: **"Perlu Rembug Keluarga / Arahan Pemangku"** to remind couples to confirm with their elders and officiant (*sulinggih/pamangku*).

3. **Persistent Provenance:**
   - When templates are added to a wedding plan, their `template_id` and bibliographic citations are retained in `wedding_ceremonies`.
   - Custom user-added ceremonies are clearly distinguished from literature-sourced templates.

---

## 2. Onboarding Workflow (3 Steps)

The onboarding wizard is accessed at `/workspace/[weddingId]/onboarding`:

```
┌─────────────────────────────────┐
│   Step 1: Tinjau Adat & Dresta   │
│   (Review marriage form & info) │
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│   Step 2: Susun & Kustomisasi   │
│   - Move Up / Move Down         │
│   - Add Custom Ceremony         │
│   - Remove / Skip               │
│   - View Provenance & Warnings  │
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│   Step 3: Finalisasi & Terapkan │
│   (Batch save to workspace)     │
└─────────────────────────────────┘
```

### Resuming & Editing Anytime
- The onboarding wizard can be re-run at any time via the **"Atur Ulang / Edit Rencana"** button in the workspace dashboard.
- If ceremonies already exist in the workspace, the wizard pre-loads them, allowing couples to adjust dates, PICs, and sequence as wedding preparations evolve.

---

## 3. Data Flow & Persistence

- **Route:** `/workspace/[weddingId]/onboarding`
- **Server Action:** `saveCeremonyPlanAction(weddingId, items)`
- **Target Table:** `public.wedding_ceremonies`
- **Audit Logging:** Every applied plan logs an audit record (`ceremonies.plan_applied`) in `activity_logs`.
- **Status Progression:** Ceremonies support statuses `draft` -> `confirmed` -> `completed` (or `skipped`), toggleable directly from the workspace overview list.

---

## 4. Verification Commands

```bash
# Check code formatting
pnpm format:check

# Run linting
pnpm lint

# TypeScript strict type checking
pnpm typecheck

# Automated test suite
pnpm test

# Production optimized build
pnpm build
```

