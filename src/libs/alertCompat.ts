"use client";

import { toast } from "sonner";
import { confirmAction, showError, showSuccess } from "@/libs/swal";

type AlertIcon = "success" | "error" | "warning" | "info" | "question";

type AlertOptions = {
  title?: string;
  text?: string;
  icon?: AlertIcon;
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  [key: string]: unknown;
};

type AlertResult = {
  isConfirmed: boolean;
  isDismissed: boolean;
};

async function fire(
  optionsOrTitle: AlertOptions | string,
  text?: string,
  icon?: AlertIcon,
): Promise<AlertResult> {
  const options: AlertOptions =
    typeof optionsOrTitle === "string"
      ? { title: optionsOrTitle, text, icon }
      : optionsOrTitle;
  const title = options.title || "Informasi";

  if (options.showCancelButton) {
    const confirmed = await confirmAction(title, options.text, {
      confirmLabel: options.confirmButtonText,
      cancelLabel: options.cancelButtonText,
      tone: options.icon === "warning" ? "danger" : "primary",
    });

    return { isConfirmed: confirmed, isDismissed: !confirmed };
  }

  if (options.icon === "success") {
    showSuccess(title, options.text);
  } else if (options.icon === "error") {
    showError(title, options.text);
  } else if (options.icon === "warning") {
    toast.warning(title, { description: options.text });
  } else {
    toast.info(title, { description: options.text });
  }

  return { isConfirmed: true, isDismissed: false };
}

export const appAlertCompat = {
  fire,
  mixin: (options?: AlertOptions) => {
    void options;
    return { fire };
  },
};
