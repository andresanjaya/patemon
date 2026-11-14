import type { UserRole } from "./types";

export interface PermissionCheckParams {
  userRole: UserRole | null;
  action: "read" | "create" | "update" | "delete" | "manage_members";
  resourceType:
    | "wedding"
    | "member"
    | "ceremony"
    | "banten"
    | "budget"
    | "task"
    | "vendor"
    | "guest"
    | "rundown";
}

/**
 * Checks whether a given role has permission to perform an action on a resource.
 * Mirrors the PostgreSQL Row Level Security (RLS) policy hierarchy:
 * - 'owner': full administrative and operational control
 * - 'editor': operational read/create/update/delete on planning items
 * - 'viewer': read-only access
 */
export function canPerformAction({
  userRole,
  action,
  resourceType,
}: PermissionCheckParams): boolean {
  if (!userRole) return false;

  // Owner has unrestricted access
  if (userRole === "owner") return true;

  // Editor can read and modify wedding planning items, but cannot delete workspace or manage members
  if (userRole === "editor") {
    if (action === "manage_members") return false;
    if (
      resourceType === "wedding" &&
      (action === "delete" || action === "update")
    ) {
      return false;
    }
    return true;
  }

  // Viewer has strict read-only access
  if (userRole === "viewer") {
    return action === "read";
  }

  return false;
}

/**
 * Enforces multi-tenant workspace isolation.
 * Validates if a user has active membership with at least the required role for a target wedding.
 */
export function isAuthorizedForWedding(
  userMemberships: Array<{ weddingId: string; role: UserRole }>,
  targetWeddingId: string,
  requiredRole: UserRole = "viewer"
): boolean {
  const membership = userMemberships.find(
    (m) => m.weddingId === targetWeddingId
  );
  if (!membership) return false;

  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    editor: 2,
    owner: 3,
  };

  return roleHierarchy[membership.role] >= roleHierarchy[requiredRole];
}
