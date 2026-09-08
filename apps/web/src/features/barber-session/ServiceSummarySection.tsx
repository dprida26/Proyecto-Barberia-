"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface ServiceSummarySectionProps {
  title: string;
  totalCount: number;
  items: { key: string; label: string; count: number }[];
  emptyLabel: string;
  defaultOpen?: boolean;
}

export function ServiceSummarySection({
  title,
  totalCount,
  items,
  emptyLabel,
  defaultOpen = false,
}: ServiceSummarySectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="primary">{totalCount} servicios</Badge>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-5 pb-5">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{emptyLabel}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {items.map((item) => (
                  <li key={item.key} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-foreground">{item.label}</span>
                    <span className="font-medium text-muted-foreground">{item.count}</span>
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
