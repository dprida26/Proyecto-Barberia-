"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useAdminServiceNotifications } from "@/features/dashboard/use-admin-service-notifications";

function AdminNotificationsListener() {
  useAdminServiceNotifications();
  return null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="ADMIN">
      <AdminNotificationsListener />
      <div className="flex min-h-screen bg-background md:flex-row flex-col">
        <AdminSidebar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </AuthGuard>
  );
}
