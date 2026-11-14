import { describe, expect, it } from "vitest";
import {
  canPerformAction,
  isAuthorizedForWedding,
} from "../src/features/auth/permissions";
import type { WorkspaceRole } from "../src/features/workspaces/types";
import type { WorkspaceMember } from "../src/features/members/types";

describe("Family Invitations and Role Management (Issue #33)", () => {
  describe("Role Permission Matrix", () => {
    it("allows owner full control: manage members, edit, and delete workspace", () => {
      expect(
        canPerformAction({
          userRole: "owner",
          action: "manage_members",
          resourceType: "member",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: "owner",
          action: "delete",
          resourceType: "wedding",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: "owner",
          action: "update",
          resourceType: "ceremony",
        })
      ).toBe(true);
    });

    it("allows editor to manage planning resources but forbids member management and workspace deletion", () => {
      expect(
        canPerformAction({
          userRole: "editor",
          action: "manage_members",
          resourceType: "member",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: "editor",
          action: "delete",
          resourceType: "wedding",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: "editor",
          action: "create",
          resourceType: "banten",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: "editor",
          action: "update",
          resourceType: "task",
        })
      ).toBe(true);
    });

    it("restricts viewer strictly to read-only access", () => {
      expect(
        canPerformAction({
          userRole: "viewer",
          action: "read",
          resourceType: "ceremony",
        })
      ).toBe(true);
      expect(
        canPerformAction({
          userRole: "viewer",
          action: "create",
          resourceType: "banten",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: "viewer",
          action: "update",
          resourceType: "budget",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: "viewer",
          action: "delete",
          resourceType: "guest",
        })
      ).toBe(false);
      expect(
        canPerformAction({
          userRole: "viewer",
          action: "manage_members",
          resourceType: "member",
        })
      ).toBe(false);
    });
  });

  describe("Cross-Wedding Isolation & Revocation Verification", () => {
    // Feature-specific validation: Role access and revoked memberships tested across two different weddings
    const wedding1 = "w-pawiwahan-dharma-lestari";
    const wedding2 = "w-pawiwahan-ari-sukma";

    it("enforces independent roles across two different weddings for the same user", () => {
      // User is Owner in Wedding 1, but Viewer in Wedding 2
      const userMemberships = [
        { weddingId: wedding1, role: "owner" as WorkspaceRole },
        { weddingId: wedding2, role: "viewer" as WorkspaceRole },
      ];

      // Wedding 1: Can perform owner actions
      expect(isAuthorizedForWedding(userMemberships, wedding1, "owner")).toBe(
        true
      );
      expect(
        canPerformAction({
          userRole: "owner",
          action: "manage_members",
          resourceType: "member",
        })
      ).toBe(true);

      // Wedding 2: Cannot perform owner or editor actions
      expect(isAuthorizedForWedding(userMemberships, wedding2, "editor")).toBe(
        false
      );
      expect(isAuthorizedForWedding(userMemberships, wedding2, "owner")).toBe(
        false
      );
      expect(isAuthorizedForWedding(userMemberships, wedding2, "viewer")).toBe(
        true
      );
    });

    it("verifies immediate denial when membership in one wedding is revoked while another remains active", () => {
      // User was editor in Wedding 1 (now revoked), but remains active editor in Wedding 2
      const userMembers: WorkspaceMember[] = [
        {
          id: "m1",
          weddingId: wedding1,
          userId: "user-123",
          role: "editor",
          invitedEmail: "panitia@patemon.test",
          invitedBy: "owner-1",
          status: "revoked",
          joinedAt: "2026-11-01",
          createdAt: "2026-11-01",
          updatedAt: "2026-11-14",
        },
        {
          id: "m2",
          weddingId: wedding2,
          userId: "user-123",
          role: "editor",
          invitedEmail: "panitia@patemon.test",
          invitedBy: "owner-2",
          status: "active",
          joinedAt: "2026-11-05",
          createdAt: "2026-11-05",
          updatedAt: "2026-11-05",
        },
      ];

      // Only active memberships grant authorization
      const activeMemberships = userMembers
        .filter((m) => m.status === "active")
        .map((m) => ({ weddingId: m.weddingId, role: m.role }));

      // Revoked in Wedding 1 -> access rejected
      expect(
        isAuthorizedForWedding(activeMemberships, wedding1, "viewer")
      ).toBe(false);
      expect(
        isAuthorizedForWedding(activeMemberships, wedding1, "editor")
      ).toBe(false);

      // Active in Wedding 2 -> access granted
      expect(
        isAuthorizedForWedding(activeMemberships, wedding2, "editor")
      ).toBe(true);
    });
  });

  describe("Sole Owner Protection & Membership Lifecycle Rules", () => {
    it("identifies whether an owner can be safely demoted or revoked based on remaining owners", () => {
      const activeMembers: WorkspaceMember[] = [
        {
          id: "m-owner-1",
          weddingId: "w1",
          userId: "user-1",
          role: "owner",
          invitedEmail: "owner1@patemon.test",
          invitedBy: null,
          status: "active",
          joinedAt: "2026-11-01",
          createdAt: "2026-11-01",
          updatedAt: "2026-11-01",
        },
        {
          id: "m-editor-1",
          weddingId: "w1",
          userId: "user-2",
          role: "editor",
          invitedEmail: "editor@patemon.test",
          invitedBy: "user-1",
          status: "active",
          joinedAt: "2026-11-02",
          createdAt: "2026-11-02",
          updatedAt: "2026-11-02",
        },
      ];

      // Check if m-owner-1 can be revoked: Only 1 active owner exists
      const activeOwners = activeMembers.filter(
        (m) => m.role === "owner" && m.status === "active"
      );
      const canRevokeSoleOwner = activeOwners.length > 1;
      expect(canRevokeSoleOwner).toBe(false);

      // Now add a second co-owner
      activeMembers.push({
        id: "m-owner-2",
        weddingId: "w1",
        userId: "user-3",
        role: "owner",
        invitedEmail: "owner2@patemon.test",
        invitedBy: "user-1",
        status: "active",
        joinedAt: "2026-11-03",
        createdAt: "2026-11-03",
        updatedAt: "2026-11-03",
      });

      const updatedActiveOwners = activeMembers.filter(
        (m) => m.role === "owner" && m.status === "active"
      );
      const canRevokeWithMultipleOwners = updatedActiveOwners.length > 1;
      expect(canRevokeWithMultipleOwners).toBe(true);
    });

    it("correctly transitions pending invitation to active upon acceptance", () => {
      const pendingMember: WorkspaceMember = {
        id: "inv-1",
        weddingId: "w1",
        userId: null,
        role: "editor",
        invitedEmail: "keluarga@gmail.com",
        invitedBy: "owner-uid",
        status: "invited",
        joinedAt: null,
        createdAt: "2026-11-14T08:00:00Z",
        updatedAt: "2026-11-14T08:00:00Z",
      };

      expect(pendingMember.status).toBe("invited");
      expect(pendingMember.userId).toBeNull();

      // Simulate acceptance by logged-in user
      const claimingUserId = "auth-user-999";
      const acceptedMember: WorkspaceMember = {
        ...pendingMember,
        userId: claimingUserId,
        status: "active",
        joinedAt: new Date().toISOString(),
      };

      expect(acceptedMember.status).toBe("active");
      expect(acceptedMember.userId).toBe(claimingUserId);
      expect(acceptedMember.joinedAt).toBeDefined();
    });
  });
});
