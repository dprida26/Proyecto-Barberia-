"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/session.store";

export default function HomePage() {
  const router = useRouter();
  const { user } = useSessionStore();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else if (user.role === "ADMIN") {
      router.replace("/dashboard");
    } else {
      router.replace("/barbero");
    }
  }, [user, router]);

  return null;
}
