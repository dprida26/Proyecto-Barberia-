"use client";

import { Scissors } from "lucide-react";
import { resolveLogoUrl } from "@/lib/env";
import { useTenantSettings } from "@/features/tenant-settings/use-tenant-settings";

export function BrandHeader() {
  const { data: tenant } = useTenantSettings();

  return (
    <div className="flex items-center gap-2.5 overflow-hidden">
      {tenant?.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolveLogoUrl(tenant.logoUrl)!}
          alt={tenant.name}
          className="h-8 w-8 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Scissors className="h-4 w-4" />
        </span>
      )}
      <span className="truncate text-lg font-bold text-foreground">{tenant?.name ?? "BarberOps"}</span>
    </div>
  );
}
