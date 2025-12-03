"use client";

import { ReactNode } from "react";
import { useAdminUser } from "@/libs/useAdminUser";

interface EditGateProps {
  children: ReactNode;
}

/**
 * Component yang hanya menampilkan children jika user memiliki role 'admin' atau 'editor'.
 * Digunakan untuk menyembunyikan tombol edit/delete bagi yang tidak berwenang.
 */
export function EditGate({ children }: EditGateProps) {
  const { user } = useAdminUser();

  if (!user || (user.role !== "admin" && user.role !== "editor")) {
    return null;
  }

  return <>{children}</>;
}
