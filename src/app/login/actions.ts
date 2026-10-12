"use server";

import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn } from "@/auth";

export type LoginState = {
  error?: string;
};

function getSafeCallbackUrl(value: FormDataEntryValue | null) {
  const callbackUrl = String(value || "/");

  if (
    callbackUrl === "/login" ||
    callbackUrl === "/admin" ||
    callbackUrl === "/admin/login" ||
    callbackUrl.startsWith("/login?") ||
    callbackUrl.startsWith("/admin/login?")
  ) {
    return "/";
  }

  if (!callbackUrl.startsWith("/")) {
    return "/";
  }

  return callbackUrl;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const nim = String(formData.get("nim") || "").trim();
  const password = String(formData.get("password") || "");
  const callbackUrl = getSafeCallbackUrl(formData.get("callbackUrl"));

  if (!nim || !password) {
    return {
      error: "NIM dan password wajib diisi.",
    };
  }

  try {
    await signIn("credentials", {
      nim,
      password,
      redirectTo: callbackUrl,
    });

    return {};
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuthError) {
      return {
        error: "NIM atau password salah.",
      };
    }

    console.error(error);

    return {
      error: "Terjadi kesalahan saat login.",
    };
  }
}
