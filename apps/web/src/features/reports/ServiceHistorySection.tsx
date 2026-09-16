"use client";

import { useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useDeleteServiceSessionItem,
  useServiceSessions,
  type ServiceSessionItemRow,
  type ServiceSessionRow,
} from "./use-service-sessions";

function formatGs(value: string | number) {
  return `Gs. ${Number(value).toLocaleString("es-PY")}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TIMEZONE = "America/Asuncion";

function dayKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date(iso));
}

function formatDayLabel(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const label = new Intl.DateTimeFormat("es-PY", {
    timeZone: "UTC",
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const MIN_REASON_LENGTH = 10;

interface Row {
  session: ServiceSessionRow;
  item: ServiceSessionItemRow;
}

interface Target {
  session: ServiceSessionRow;
  item: ServiceSessionItemRow;
}

interface DayGroup {
  key: string;
  label: string;
  rows: Row[];
  total: number;
}

function groupByDay(rows: Row[]): DayGroup[] {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = dayKey(row.session.startedAt);
    const existing = groups.get(key);
    if (existing) {
      existing.push(row);
    } else {
      groups.set(key, [row]);
    }
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([key, dayRows]) => ({
      key,
      label: formatDayLabel(key),
      rows: dayRows,
      total: dayRows.reduce((sum, { item }) => sum + Number(item.priceAtStart), 0),
    }));
}

export function ServiceHistorySection({ from, to }: { from: Date; to: Date }) {
  const { data: sessions, isLoading } = useServiceSessions({ from, to });
  const deleteItem = useDeleteServiceSessionItem();
  const [target, setTarget] = useState<Target | null>(null);
  const [reason, setReason] = useState("");

  function closeDialog() {
    setTarget(null);
    setReason("");
  }

  async function confirmDelete() {
    if (!target) return;
    try {
      await deleteItem.mutateAsync({
        sessionId: target.session.id,
        itemId: target.item.id,
        deleteReason: reason.trim(),
      });
      toast.success("Servicio eliminado del historial");
      closeDialog();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo eliminar el servicio";
      toast.error(message);
    }
  }

  const reasonTooShort = reason.trim().length < MIN_REASON_LENGTH;

  const rows = (sessions ?? []).flatMap((session) =>
    session.items
      .filter((item) => !item.deletedAt)
      .map((item) => ({ session, item })),
  );

  const dayGroups = groupByDay(rows);

  return (
    <Card>
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="w-full [&[data-state=open]_.chevron]:rotate-180">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Historial de servicios</CardTitle>
            <ChevronDown className="chevron h-4 w-4 text-muted-foreground transition-transform" />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando historial...</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay servicios completados en este periodo.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {dayGroups.map((group) => (
                  <Collapsible key={group.key} defaultOpen={false} className="py-2 first:pt-0">
                    <CollapsibleTrigger className="w-full [&[data-state=open]_.day-chevron]:rotate-180">
                      <div className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
                        <div className="text-left">
                          <p className="font-medium text-foreground">{group.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {group.rows.length} {group.rows.length === 1 ? "servicio" : "servicios"} ·{" "}
                            {formatGs(group.total)}
                          </p>
                        </div>
                        <ChevronDown className="day-chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {/* Mobile: stacked cards */}
                      <div
                        data-testid="service-history-mobile"
                        className="flex flex-col divide-y divide-border md:hidden"
                      >
                        {group.rows.map(({ session, item }) => (
                          <div key={item.id} className="flex items-start justify-between gap-3 py-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-foreground">{item.service.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {session.barber.displayName} · {formatDateTime(session.startedAt)}
                              </p>
                              {session.clientNameFree ? (
                                <p className="text-sm text-muted-foreground">{session.clientNameFree}</p>
                              ) : null}
                              <p className="mt-1 text-sm font-semibold text-foreground">
                                {formatGs(item.priceAtStart)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Eliminar servicio"
                              className="shrink-0 text-destructive hover:text-destructive"
                              onClick={() => setTarget({ session, item })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      {/* Desktop: table */}
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Hora</TableHead>
                              <TableHead>Barbero</TableHead>
                              <TableHead>Servicio</TableHead>
                              <TableHead>Cliente</TableHead>
                              <TableHead>Monto</TableHead>
                              <TableHead className="text-right">Accion</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.rows.map(({ session, item }) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  {new Date(session.startedAt).toLocaleTimeString("es-PY", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </TableCell>
                                <TableCell>{session.barber.displayName}</TableCell>
                                <TableCell>{item.service.name}</TableCell>
                                <TableCell>{session.clientNameFree || "-"}</TableCell>
                                <TableCell>{formatGs(item.priceAtStart)}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setTarget({ session, item })}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Eliminar
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={Boolean(target)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar servicio</DialogTitle>
            <DialogDescription>
              {target ? (
                <>
                  Se eliminara solo <strong>{target.item.service.name}</strong> de esta sesion. Si la sesion
                  tiene otros servicios, quedan intactos. Esta accion queda registrada como evidencia y no se
                  puede deshacer. Indica el motivo de la eliminacion.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: el barbero marco el servicio por error, no se realizo."
            maxLength={300}
          />
          <p className="text-xs text-muted-foreground">
            Minimo {MIN_REASON_LENGTH} caracteres ({reason.trim().length}/{MIN_REASON_LENGTH})
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={reasonTooShort || deleteItem.isPending}
              onClick={confirmDelete}
            >
              {deleteItem.isPending ? "Eliminando..." : "Si, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
