"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { canAccess, type PermissionAction } from "@/libs/auth/access";

interface EditGateProps {
  children: ReactNode;
  scope: string;
  action: PermissionAction;
}

/**
 * Component yang hanya menampilkan children jika user memiliki role 'admin' atau 'editor'.
 * Digunakan untuk menyembunyikan tombol edit/delete bagi yang tidak berwenang.
 */
export default function EditGate({ children, scope, action }: EditGateProps) {
  const { data: session, status } = useSession();
  if (status !== "authenticated" || !canAccess(session?.user, scope, action)) {
    return null;
  }
  return <>{children}</>;
}
