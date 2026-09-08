"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "rounded-lg border border-border bg-background text-foreground shadow-md",
          success: "!text-success",
          error: "!text-destructive",
        },
      }}
    />
  );
}
