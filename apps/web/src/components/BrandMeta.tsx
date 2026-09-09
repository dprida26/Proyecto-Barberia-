"use client";

import { useEffect } from "react";
import { useTenantBranding } from "@/features/tenant-settings/use-tenant-settings";
import { resolveLogoUrl } from "@/lib/env";

/**
 * Actualiza el titulo de la pestaña y el favicon con el nombre/logo del
 * negocio una vez que se cargan desde la API. El <title> y el favicon por
 * defecto en layout.tsx son estaticos (metadata de servidor) porque el
 * branding del tenant es un dato dinamico que solo se conoce en cliente.
 */
export function BrandMeta() {
  const { data: branding } = useTenantBranding();

  useEffect(() => {
    if (branding?.name) {
      document.title = branding.name;
    }
  }, [branding?.name]);

  useEffect(() => {
    const logoUrl = resolveLogoUrl(branding?.logoUrl);
    if (!logoUrl) return;

    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = logoUrl;
  }, [branding?.logoUrl]);

  return null;
}
