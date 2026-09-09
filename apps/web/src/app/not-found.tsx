"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTenantBranding } from "@/features/tenant-settings/use-tenant-settings";
import { resolveLogoUrl } from "@/lib/env";

export default function NotFound() {
  const { data: branding } = useTenantBranding();

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          {branding?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveLogoUrl(branding.logoUrl)!}
              alt={branding.name}
              className="mb-2 h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Compass className="h-6 w-6" />
            </span>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {branding?.name ?? "BarberOps"}
          </h1>
          <p className="text-sm text-muted-foreground">La pagina que buscas no existe.</p>
        </CardHeader>

        <CardContent>
          <Button asChild size="lg" className="w-full">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
