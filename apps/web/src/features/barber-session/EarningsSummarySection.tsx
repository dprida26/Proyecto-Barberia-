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
    count: number;
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
            <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Para la barberia</span>
              <span className="font-medium text-foreground">{formatGs(totalBusinessEarning)}</span>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{emptyLabel}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {items.map((item) => (
                  <li key={item.key} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-foreground">
                      {item.label} <span className="text-muted-foreground">x{item.count}</span>
                    </span>
                    <span className="font-medium text-success">{formatGs(item.barberEarning)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
