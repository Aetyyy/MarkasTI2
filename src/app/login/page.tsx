import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "@/components/auth/loginForm";
import { getAdminLandingPath } from "@/libs/auth/access";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect(getAdminLandingPath(session.user));
  }

  return (
    <main className="app-page-canvas relative min-h-screen overflow-hidden px-[var(--app-page-gutter)] py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-300/30 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center justify-center">
        <Suspense
          fallback={
            <div className="h-[650px] w-full max-w-6xl animate-pulse rounded-[2rem] bg-white/70" />
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
