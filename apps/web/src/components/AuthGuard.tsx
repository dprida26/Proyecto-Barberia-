"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@barberops/shared";
import { useSessionStore } from "@/stores/session.store";

export function AuthGuard({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else if (user.role !== role) {
      router.replace(user.role === "ADMIN" ? "/dashboard" : "/barbero");
    }
  }, [user, role, router]);

  if (!user || user.role !== role) return null;

  return <>{children}</>;
}
