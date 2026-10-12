import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { PermissionAction } from "@/libs/auth/access";
import { canAccess, hasAssignedRole } from "@/libs/auth/access";

export class AuthorizationError extends Error {
  code: "UNAUTHORIZED" | "FORBIDDEN";

  constructor(code: "UNAUTHORIZED" | "FORBIDDEN", message: string) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
  }
}

export async function requirePermission(
  scopeName: string,
  action: PermissionAction,
) {
  const session = await auth();

  if (!session?.user) {
    throw new AuthorizationError(
      "UNAUTHORIZED",
      "Kamu harus login terlebih dahulu.",
    );
  }

  if (!canAccess(session.user, scopeName, action)) {
    throw new AuthorizationError(
      "FORBIDDEN",
      "Kamu tidak punya izin untuk mengakses fitur ini.",
    );
  }

  return session.user;
}

export async function requirePagePermission(
  scopeName: string,
  action: PermissionAction = "read",
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccess(session.user, scopeName, action)) {
    redirect("/unauthorized");
  }

  return session.user;
}

export async function requireAdminArea() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasAssignedRole(session.user)) {
    redirect("/");
  }

  return session.user;
}

export function getAuthorizationErrorMessage(error: unknown) {
  if (error instanceof AuthorizationError) {
    return error.message;
  }

  return null;
}
