"use client";

import { Toaster } from "sonner";

export default function FeedbackToaster() {
  return (
    <Toaster
      closeButton
      expand
      richColors
      position="top-center"
      visibleToasts={4}
      duration={3600}
      gap={10}
      toastOptions={{
        className: "app-toast",
        classNames: {
          title: "app-toast-title",
          description: "app-toast-description",
          actionButton: "app-toast-action",
          cancelButton: "app-toast-cancel",
          closeButton: "app-toast-close",
        },
      }}
    />
  );
}
