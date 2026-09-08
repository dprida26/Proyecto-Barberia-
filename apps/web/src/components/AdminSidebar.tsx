"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, LogOut, Menu, Scissors, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session.store";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/servicios", label: "Servicios", icon: Scissors },
  { href: "/barberos", label: "Barberos", icon: Users },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
];

function SidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-4.5 w-4.5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const clearSession = useSessionStore((s) => s.clearSession);
  const user = useSessionStore((s) => s.user);

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <span className="text-lg font-bold text-primary">BarberOps</span>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col gap-6 bg-card py-5 shadow-lg">
            <div className="flex items-center justify-between px-4">
              <span className="text-lg font-bold text-primary">BarberOps</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Cerrar menu">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarLinks onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-border px-3 pt-3">
              <button
                onClick={clearSession}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent"
              >
                <LogOut className="h-4.5 w-4.5" />
                Salir
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col gap-6 border-r border-border bg-card py-6 md:flex">
        <div className="px-5">
          <span className="text-xl font-bold text-primary">BarberOps</span>
        </div>
        <SidebarLinks />
        <div className="border-t border-border px-3 pt-4">
          {user && (
            <div className="mb-2 px-3">
              <p className="truncate text-sm font-medium text-foreground">{user.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          )}
          <button
            onClick={clearSession}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-4.5 w-4.5" />
            Salir
          </button>
        </div>
      </aside>
    </>
  );
}
