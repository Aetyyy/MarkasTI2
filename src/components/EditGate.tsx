"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { canAccess, type PermissionAction } from "@/libs/auth/access";

interface EditGateProps {
  children: ReactNode;
  scope: string;
  action: PermissionAction;
}

/**
 * Menyembunyikan kontrol UI jika sesi tidak memiliki izin yang diminta.
 */
export function EditGate({ children, scope, action }: EditGateProps) {
  const { data: session, status } = useSession();
  if (status !== "authenticated" || !canAccess(session?.user, scope, action)) {
    return null;
  }
  return <>{children}</>;
}

export default EditGate;
