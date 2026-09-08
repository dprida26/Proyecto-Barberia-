"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { AdminNav } from "@/components/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="ADMIN">
      <div className="min-h-screen bg-slate-50">
        <AdminNav />
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </div>
    </AuthGuard>
  );
}
