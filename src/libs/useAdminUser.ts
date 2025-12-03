"use client";

import { useEffect, useState } from "react";

export interface AdminUser {
  id: number;
  email: string;
  role: string;
}

export function useAdminUser() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/me", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.data);
        setError(null);
      } else {
        setUser(null);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, loading, error, refetch: fetchUser };
}
