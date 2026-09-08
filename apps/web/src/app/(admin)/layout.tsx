"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { AdminSidebar } from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="ADMIN">
      <div className="flex min-h-screen bg-background md:flex-row flex-col">
        <AdminSidebar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </AuthGuard>
  );
}
