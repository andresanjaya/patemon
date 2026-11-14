# Family Invitations & Role Management Guide (Issue #33)

This guide documents the architecture, database schema, role hierarchy, and invitation lifecycle for family collaboration (*Keluarga & Panitia Karya*) in Patemon MVP v1.

---

## 1. Overview & Cultural Objectives

Balinese Hindu weddings require coordination across multiple family branches (*Purusa* & *Pradana*), customary officials (*Prajuru Banjar*), ritual specialists (*Serati Banten*, *Pemangku*, *Ida Pedanda*), and committee coordinators (*panitia karya*).

To balance accessibility with data integrity and privacy:
1. **Authenticated Access:** Access is bound to verified user accounts (`profiles.id` / `auth.users`), never to insecure reusable public passwords or shareable purchase codes.
2. **Three-Tier Role Hierarchy:** Strict enforcement across PostgreSQL Row Level Security (RLS) policies and Server Actions.
3. **Multi-Wedding Isolation:** A user can be an Owner in their own wedding workspace and a Viewer or Editor in a relative's wedding workspace. Revoking access in one wedding does not impact any other.
4. **WhatsApp Invitation Sharing:** 1-click generation of Balinese customary invite messages with workspace links.
5. **Pending Invitations Hub:** In-app invitation notification on the `/workspaces` dashboard allowing users to Accept or Decline with 1 click.

---

## 2. Role Permission Matrix

| Capability / Module | Pemilik (Owner) | Editor (Panitia / Serati) | Pengamat (Viewer) |
|---|:---:|:---:|:---:|
| **Lihat Rencana (Read All Modules)** | ✅ | ✅ | ✅ |
| **Kelola Rangkaian Adat & Tanggal** | ✅ | ✅ | ❌ |
| **Kelola Kebutuhan Banten & Sarana** | ✅ | ✅ | ❌ |
| **Kelola Checklist & Alokasi PIC** | ✅ | ✅ | ❌ |
| **Kelola Anggaran & Catatan Bayar** | ✅ | ✅ | ❌ |
| **Kelola Rekanan & Vendor** | ✅ | ✅ | ❌ |
| **Kelola Tamu & Ekspor CSV** | ✅ | ✅ | ❌ |
| **Kelola Susunan Acara (Rundown)** | ✅ | ✅ | ❌ |
| **Undang Anggota Keluarga** | ✅ | ❌ | ❌ |
| **Ubah Peran Anggota (Role Change)** | ✅ | ❌ | ❌ |
| **Cabut Akses Anggota (Revoke)** | ✅ | ❌ | ❌ |
| **Ubah Pengaturan Inti / Target Budget**| ✅ | ❌ | ❌ |
| **Hapus Workspace Pawiwahan** | ✅ | ❌ | ❌ |

---

## 3. Database Schema & RLS

The feature maps to `public.wedding_members` defined in migration `20261114000001_initial_schema.sql` and `20261114000002_auth_and_rls.sql`:

```sql
CREATE TABLE public.wedding_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_email TEXT NOT NULL,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'revoked')),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_wedding_members_user UNIQUE (wedding_id, user_id),
  CONSTRAINT uq_wedding_members_email UNIQUE (wedding_id, invited_email)
);
```

### Safety Invariants
- **Sole Owner Protection:** A workspace cannot demote or revoke its last active owner. An error is returned if attempting to remove the only remaining owner.
- **Immediate Revocation:** Setting `status = 'revoked'` causes `has_wedding_role` in Postgres RLS to return `FALSE` immediately, blocking all subsequent reads and mutations.

---

## 4. File Organization

```
src/
├── app/(dashboard)/
│   ├── workspace/[weddingId]/settings/
│   │   └── page.tsx                     # Workspace Settings & Members Manager
│   └── workspaces/
│       └── page.tsx                     # Workspaces Hub with Pending Invitations Banner
└── features/
    ├── members/
    │   ├── types.ts                     # WorkspaceMember, Role config, Inputs
    │   ├── actions.ts                   # Server actions: invite, role change, revoke, accept, decline
    │   └── components/
    │       ├── member-list.tsx          # Member cards, role dropdown, revoke action, WA share
    │       ├── invite-member-modal.tsx  # Invitation modal with email & role selector
    │       ├── workspace-members-card.tsx # Integrated card container
    │       └── pending-invitations-banner.tsx # In-app notification for invited users
    └── auth/
        └── permissions.ts               # canPerformAction & isAuthorizedForWedding
```

---

## 5. Automated Tests

Run test suite via:
```bash
pnpm test
```
Tests in `tests/family-invitations.test.ts` (7 tests) and `tests/auth-rls.test.ts` (11 tests) verify:
- Permission matrix adherence across all roles.
- Cross-wedding isolation (revoked in Wedding 1 while active in Wedding 2).
- Sole owner preservation safeguards.
- Invitation status transitions (`invited` $\rightarrow$ `active`).

