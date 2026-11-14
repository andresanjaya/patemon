# Wedding Workspace Architecture & Guide

Patemon enables couples and extended family members to organize Hindu Balinese weddings (*pawiwahan*) across isolated, collaborative workspaces.

---

## 1. Data Model & Entity Relations

Each wedding is represented by a record in the `weddings` table, associated with memberships in `wedding_members` and audit records in `activity_logs`.

```
                    ┌────────────────────────┐
                    │      auth.users        │
                    └───────────┬────────────┘
                                │ 1:1
                    ┌───────────▼────────────┐
                    │        profiles        │
                    └───────────┬────────────┘
                                │ 1:N
                    ┌───────────▼────────────┐
                    │    wedding_members     │
                    │ (role: owner/editor/v) │
                    └───────────▲────────────┘
                                │ N:1
┌───────────────────────────────┴───────────────────────────────┐
│                           weddings                            │
│  - couple_names: string                                       │
│  - groom_name: string | null (Purusa)                         │
│  - bride_name: string | null (Pradana)                        │
│  - marriage_form: 'memadik' | 'ngerorod' | 'nyentana' | 'c'   │
│  - prospective_date: date | null (Dewasa Ayu)                 │
│  - location_region: string | null                             │
│  - target_budget: integer IDR                                 │
│  - notes: string | null                                       │
│  - created_by: uuid (creator/initial owner)                   │
│  - deleted_at: timestamp | null (soft delete)                 │
└───────────────────────────────┬───────────────────────────────┘
                                │ 1:N
                    ┌───────────▼────────────┐
                    │     activity_logs      │
                    │   (audit trail log)    │
                    └────────────────────────┘
```

---

## 2. Core Features & User Journeys

### A. Creating a Workspace
- **Route:** `/workspace/new`
- **Action:** `createWeddingWorkspaceAction`
- **Behavior:**
  1. Authenticated user inputs required couple names and optional adat attributes (groom, bride, marriage form, region, tentative date, budget, notes).
  2. The server action creates the wedding workspace record.
  3. The creator is automatically inserted into `wedding_members` with the `owner` role.
  4. An audit log (`workspace.created`) is captured.
  5. The user is redirected to `/workspace/[weddingId]`.

### B. Multiple Weddings & Switching
- **Route:** `/workspaces`
- **Component:** `WorkspaceSwitcher`
- **Behavior:**
  - Users can create and participate in multiple workspaces (e.g. organizing their own pawiwahan as `owner`, or assisting a sibling/relative as `editor` or `viewer`).
  - The `WorkspaceSwitcher` dropdown appears in the workspace header, displaying the current active workspace, user role badge, quick links to other workspaces, and "+ Buat Pawiwahan Baru".

### C. Workspace Settings & Editing
- **Route:** `/workspace/[weddingId]/settings`
- **Action:** `updateWeddingWorkspaceAction` & `deleteWeddingWorkspaceAction`
- **Behavior:**
  - Members with `owner` or `editor` roles can update wedding titles, groom/bride names, target budgets, and ceremonial notes.
  - Owners can soft-delete the workspace (`deleted_at` timestamp).

### D. Free Preview Mode
- **Route:** `/workspace/demo`
- **Behavior:**
  - Unauthenticated visitors can explore a fully-functional sample Balinese wedding workspace without having to sign up or log in, as specified in PRD Section 5.4.

---

## 3. Marriage Forms (Bentuk Perkawinan Adat Bali)

In accordance with PRD Section 5.2, Patemon records customary wedding forms without prescribing religious dogma:

1. **Memadik / Ngidih (Umum):** Traditional proposal where the groom's family (*purusa*) proposes to the bride (*pradana*) at her family home.
2. **Ngerorod / Rangkat:** Marriage based on mutual agreement between bride and groom via customary elopement and subsequent clan settlement.
3. **Nyentana / Sentana Rajeg:** Matrilineal customary marriage where the woman functions as *purusa* and the man joins her family estate as *pradana*.
4. **Kustom / Penyesuaian:** Inter-dresta or family custom variations agreed upon by both families.

---

## 4. Permission Matrix

| Action | Owner | Editor | Viewer | Guest / Unauthenticated |
| :--- | :---: | :---: | :---: | :---: |
| View Workspace Details | ✅ | ✅ | ✅ | ❌ (Except `/workspace/demo`) |
| Edit Workspace Settings | ✅ | ✅ | ❌ | ❌ |
| Invite & Manage Team | ✅ | ❌ | ❌ | ❌ |
| Delete Workspace | ✅ | ❌ | ❌ | ❌ |

---

## 5. Verification Commands

```bash
# Prettier code formatting check
pnpm format:check

# ESLint inspection
pnpm lint

# TypeScript strict type checking
pnpm typecheck

# Automated test suite
pnpm test

# Production optimized build
pnpm build
```
