"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Orbitron, Plus_Jakarta_Sans } from "next/font/google";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiCode,
  FiEye,
  FiEyeOff,
  FiHash,
  FiLock,
  FiLogIn,
  FiShield,
  FiUserCheck,
} from "react-icons/fi";
import { loginAction } from "@/app/login/actions";
import { getAllowedLoginTarget } from "@/libs/auth/access";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

function getSafeCallbackUrl(value: string | null) {
  const callbackUrl = value || "";

  if (
    callbackUrl === "/login" ||
    callbackUrl === "/admin" ||
    callbackUrl === "/admin/login" ||
    callbackUrl.startsWith("/login?") ||
    callbackUrl.startsWith("/admin/login?")
  ) {
    return "";
  }

  if (!callbackUrl.startsWith("/")) {
    return "";
  }

  return callbackUrl;
}

export default function LoginForm() {
  const searchParams = useSearchParams();
  const { update } = useSession();

  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));

  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        nim,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("NIM atau password salah.");
        return;
      }

      const freshSession = await update();
      window.location.replace(
        getAllowedLoginTarget(freshSession?.user, callbackUrl),
      );
    } catch (error) {
      console.error(error);
      setError("Terjadi kesalahan saat login.");
    } finally {
      setLoading(false);
    }
  }

  const [state, formAction] = useActionState(loginAction, {
    error: "",
  });

  return (
    <section
      className={`${jakarta.className} relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-2xl shadow-blue-900/15 backdrop-blur-xl lg:grid-cols-[1fr_0.9fr]`}
    >
      <div className="relative p-6 md:p-10">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />

        <Link
          href="/"
          className="group mb-8 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/70 px-4 py-2 text-xs font-extrabold text-blue-700 shadow-sm transition-all duration-300 hover:-translate-x-1 hover:bg-blue-50"
        >
          <FiArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
          Kembali ke Beranda
        </Link>

        <div className="relative">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
            <FiShield className="h-7 w-7" />
          </div>

          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
            <FiUserCheck className="h-4 w-4" />
            Admin Access
          </p>

          <h1
            className={`${orbitron.className} text-3xl font-black leading-tight text-slate-950 md:text-4xl`}
          >
            Markas TI Admin
          </h1>

          <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
            Masuk ke panel admin untuk mengelola informasi kelas, jadwal,
            struktur, gallery, dan data penting MarkasTI.
          </p>
        </div>

        <form
          action={formAction}
          onSubmit={handleSubmit}
          className="relative mt-8 space-y-5"
        >
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <div>
            <label className="mb-2 block text-sm font-extrabold text-slate-700">
              NIM
            </label>

            <div className="group relative">
              <span className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-all duration-300 group-focus-within:bg-blue-600 group-focus-within:text-white">
                <FiHash className="h-5 w-5" />
              </span>

              <input
                name="nim"
                type="text"
                inputMode="numeric"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="Masukkan NIM"
                className="w-full rounded-2xl border border-blue-100 bg-white/80 py-4 pl-16 pr-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-extrabold text-slate-700">
              Password
            </label>

            <div className="group relative">
              <span className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-all duration-300 group-focus-within:bg-blue-600 group-focus-within:text-white">
                <FiLock className="h-5 w-5" />
              </span>

              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full rounded-2xl border border-blue-100 bg-white/80 py-4 pl-16 pr-14 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                disabled={loading}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition-all duration-300 hover:bg-blue-50 hover:text-blue-700"
                disabled={loading}
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                {showPassword ? (
                  <FiEyeOff className="h-5 w-5" />
                ) : (
                  <FiEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {(error || state.error) && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error || state.error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-blue-600 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
          >
            <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

            {loading ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Memproses Login...
              </>
            ) : (
              <>
                <FiLogIn className="h-5 w-5" />
                Login Sekarang
              </>
            )}
          </button>
        </form>

        <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <FiCheckCircle className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black text-slate-800">
                Akses khusus admin kelas
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Gunakan akun yang sudah terdaftar di database atau hubungi
                administrator kelas.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-linear-to-br from-blue-600 via-sky-600 to-cyan-500 p-10 text-white lg:block">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-200/20 blur-3xl" />

        <div className="relative flex h-full flex-col justify-between">
          <div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
              <FiCode className="h-7 w-7" />
            </div>

            <h2
              className={`${orbitron.className} mt-6 text-4xl font-black leading-tight`}
            >
              Welcome Back, Admin.
            </h2>

            <p className="mt-4 max-w-sm text-sm leading-7 text-blue-50">
              Kelola portal kelas dengan tampilan yang lebih rapi, cepat, dan
              modern untuk kebutuhan Teknik Informatika 2.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/20 bg-white/15 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-blue-50">
                  Security Status
                </p>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700">
                  Active
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/15 p-3">
                  <FiShield className="mb-2 h-5 w-5" />
                  <p className="text-[11px] font-semibold text-blue-50">
                    Secure
                  </p>
                </div>

                <div className="rounded-2xl bg-white/15 p-3">
                  <FiUserCheck className="mb-2 h-5 w-5" />
                  <p className="text-[11px] font-semibold text-blue-50">
                    Admin
                  </p>
                </div>

                <div className="rounded-2xl bg-white/15 p-3">
                  <FiLock className="mb-2 h-5 w-5" />
                  <p className="text-[11px] font-semibold text-blue-50">
                    Locked
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/15 p-5 backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
                MarkasTI
              </p>

              <p className="mt-2 text-2xl font-black">Admin Panel</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
