import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";
import RouteLoader from "@/components/loading/routeLoader";
import { Suspense } from "react";
import Providers from "@/app/providers";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Markas TI 2",
  description: "Pusat informasi Teknik Informatika.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=document.documentElement;r.classList.add("motionRuntime-ready");var t=localStorage.getItem("markasti-theme")||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);r.classList.toggle("dark",d);r.dataset.theme=d?"dark":"light";r.style.colorScheme=d?"dark":"light"}catch(e){}})();`,
          }}
        />
      </head>
      <body
        id="app-top"
        className={`${geistSans.variable} ${geistMono.variable} antialiased scroll-smooth`}
      >
        <Providers session={session}>
          <Suspense fallback={null}>
            <RouteLoader />
          </Suspense>

          {children}
        </Providers>
      </body>
    </html>
  );
}
