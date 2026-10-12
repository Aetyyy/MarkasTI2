"use client";

import { toast } from "sonner";
import Swal from "sweetalert2";

async function showConfirmation(
  title: string,
  text?: string,
  options?: {
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: "primary" | "danger";
  },
) {
  const danger = options?.tone === "danger";
  const result = await Swal.fire({
    title,
    text,
    icon: danger ? "warning" : "question",
    position: "center",
    showCancelButton: true,
    reverseButtons: true,
    focusCancel: true,
    buttonsStyling: false,
    confirmButtonText: options?.confirmLabel ?? "Lanjutkan",
    cancelButtonText: options?.cancelLabel ?? "Batal",
    customClass: {
      popup: "markasti-swal-popup",
      title: "markasti-swal-title",
      htmlContainer: "markasti-swal-text",
      confirmButton: danger
        ? "markasti-swal-confirm markasti-swal-danger"
        : "markasti-swal-confirm",
      cancelButton: "markasti-swal-cancel",
    },
  });

  return result.isConfirmed;
}

export function showSuccess(title: string, text?: string) {
  return toast.success(title, {
    description: text,
    duration: 2800,
  });
}

export function showError(title: string, text?: string) {
  return toast.error(title, {
    description: text,
    duration: 5200,
  });
}

export async function confirmAction(
  title: string,
  text?: string,
  options?: {
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: "primary" | "danger";
  },
) {
  return showConfirmation(title, text, options);
}
export async function confirmDanger(title: string, text?: string) {
  return showConfirmation(title, text, {
    tone: "danger",
    confirmLabel: "Ya, hapus",
    cancelLabel: "Batal",
  });
}

export function showLoading(title: string, text?: string) {
  return toast.loading(title, { description: text, duration: Infinity });
}

export function closeFeedback(id?: string | number) {
  toast.dismiss(id);
}
