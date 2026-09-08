"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSessionStore } from "@/stores/session.store";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/servicios", label: "Servicios" },
  { href: "/barberos", label: "Barberos" },
  { href: "/reportes", label: "Reportes" },
];

export function AdminNav() {
  const pathname = usePathname();
  const clearSession = useSessionStore((s) => s.clearSession);

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-1 overflow-x-auto">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
              pathname === link.href
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <button onClick={clearSession} className="text-sm font-medium text-slate-500 hover:text-slate-700">
        Salir
      </button>
    </nav>
  );
}
