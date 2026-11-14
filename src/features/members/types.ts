import type { WorkspaceRole } from "@/features/workspaces/types";

export type MemberStatus = "invited" | "active" | "revoked";

export interface WorkspaceMember {
  id: string;
  weddingId: string;
  userId: string | null;
  role: WorkspaceRole;
  invitedEmail: string;
  invitedBy: string | null;
  status: MemberStatus;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile?: {
    fullName: string | null;
    email: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface InviteMemberInput {
  weddingId: string;
  email: string;
  role: WorkspaceRole;
}

export interface UpdateMemberRoleInput {
  weddingId: string;
  memberId: string;
  role: WorkspaceRole;
}

export interface RevokeMemberInput {
  weddingId: string;
  memberId: string;
}

export interface PendingInvitation {
  id: string;
  weddingId: string;
  coupleNames: string;
  role: WorkspaceRole;
  invitedEmail: string;
  invitedByEmail: string | null;
  invitedByName: string | null;
  createdAt: string;
}

export const ROLE_CONFIG: Record<
  WorkspaceRole,
  {
    label: string;
    description: string;
    badgeClass: string;
  }
> = {
  owner: {
    label: "Pemilik (Owner)",
    description:
      "Hak penuh mengelola pernikahan, anggaran, rekanan, dan anggota keluarga.",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  },
  editor: {
    label: "Editor (Keluarga / Panitia)",
    description:
      "Dapat menambah dan mengedit prosesi adat, banten, tugas, vendor, dan rundown.",
    badgeClass:
      "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  },
  viewer: {
    label: "Pengamat (Viewer)",
    description:
      "Akses hanya-lihat (*read-only*) untuk memantau persiapan tanpa izin mengubah.",
    badgeClass:
      "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
  },
};

export const DEMO_MEMBERS: WorkspaceMember[] = [
  {
    id: "demo-m1",
    weddingId: "demo",
    userId: "demo-u1",
    role: "owner",
    invitedEmail: "purusa.dharma@patemon.test",
    invitedBy: null,
    status: "active",
    joinedAt: "2026-11-01T08:00:00Z",
    createdAt: "2026-11-01T08:00:00Z",
    updatedAt: "2026-11-01T08:00:00Z",
    profile: {
      fullName: "I Made Dharma (Purusa)",
      email: "purusa.dharma@patemon.test",
      avatarUrl: null,
    },
  },
  {
    id: "demo-m2",
    weddingId: "demo",
    userId: "demo-u2",
    role: "editor",
    invitedEmail: "pradana.lestari@patemon.test",
    invitedBy: "demo-u1",
    status: "active",
    joinedAt: "2026-11-02T10:00:00Z",
    createdAt: "2026-11-01T09:00:00Z",
    updatedAt: "2026-11-02T10:00:00Z",
    profile: {
      fullName: "Ni Putu Lestari (Pradana)",
      email: "pradana.lestari@patemon.test",
      avatarUrl: null,
    },
  },
  {
    id: "demo-m3",
    weddingId: "demo",
    userId: "demo-u3",
    role: "editor",
    invitedEmail: "serati.banten@patemon.test",
    invitedBy: "demo-u1",
    status: "active",
    joinedAt: "2026-11-05T14:00:00Z",
    createdAt: "2026-11-05T12:00:00Z",
    updatedAt: "2026-11-05T14:00:00Z",
    profile: {
      fullName: "Jero Mangku Serati (Koordinator Banten)",
      email: "serati.banten@patemon.test",
      avatarUrl: null,
    },
  },
  {
    id: "demo-m4",
    weddingId: "demo",
    userId: null,
    role: "viewer",
    invitedEmail: "keluarga.griya@patemon.test",
    invitedBy: "demo-u1",
    status: "invited",
    joinedAt: null,
    createdAt: "2026-11-10T09:00:00Z",
    updatedAt: "2026-11-10T09:00:00Z",
    profile: null,
  },
];
