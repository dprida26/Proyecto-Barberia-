"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

function formatGs(value: string | number) {
  return `Gs. ${Number(value).toLocaleString("es-PY")}`;
}

interface EarningsSummarySectionProps {
  title: string;
  totalBarberEarning: string;
  totalBusinessEarning: string;
  items: {
    key: string;
    label: string;
    count?: number;
    time?: string;
    barberEarning: string;
    businessEarning: string;
  }[];
  emptyLabel: string;
  defaultOpen?: boolean;
}

export function EarningsSummarySection({
  title,
  totalBarberEarning,
  totalBusinessEarning,
  items,
  emptyLabel,
  defaultOpen = false,
}: EarningsSummarySectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="success">{formatGs(totalBarberEarning)}</Badge>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-5 pb-5">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-success/10 px-3 py-2">
                <p className="text-xs text-muted-foreground">Para mi</p>
                <p className="font-semibold text-success">{formatGs(totalBarberEarning)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Para la barberia</p>
                <p className="font-semibold text-foreground">{formatGs(totalBusinessEarning)}</p>
              </div>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{emptyLabel}</p>
            ) : (
              <>
                <p className="mb-1 text-right text-[10px] uppercase tracking-wide text-muted-foreground">
                  Para mi / Para la barberia
                </p>
                <ul className="flex flex-col divide-y divide-border">
                {items.map((item) => (
                  <li key={item.key} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0 truncate text-foreground">
                      {item.label}{" "}
                      <span className="text-muted-foreground">
                        {item.time ? item.time : item.count !== undefined ? `x${item.count}` : null}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-baseline gap-2 text-xs">
                      <span className="font-semibold text-success">{formatGs(item.barberEarning)}</span>
                      <span className="text-muted-foreground">/ {formatGs(item.businessEarning)}</span>
                    </span>
                  </li>
                ))}
                </ul>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
