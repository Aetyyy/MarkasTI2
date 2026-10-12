"use client";

import { usePathname } from "next/navigation";
import NavbarMain from "@/components/navbar/navbarMain";

export default function Navbar() {
  const pathname = usePathname();
  const disableNavbar = ["/login", "/register", "/admin/dashboard"];

  if (disableNavbar.includes(pathname)) {
    return null;
  }

  return <NavbarMain />;
}
