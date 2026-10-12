"use client";

import { useSession } from "next-auth/react";
import { usePresence } from "@/components/presence/usePresence";

export default function NavbarOnlineIndicator() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { data } = usePresence(30_000);
  const currentPresence = data?.data.find((item) => item.id === userId);
  const online =
    Boolean(userId) &&
    (currentPresence ? currentPresence.status === "ONLINE" : true);

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-600 shadow-sm">
      <span
        className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
          online ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {online ? "Online" : "Offline"}
    </span>
  );
}
