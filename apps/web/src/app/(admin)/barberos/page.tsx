"use client";

import { useState } from "react";
import { MoreHorizontal, Plus, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBarbersAdmin, useUpdateBarber, type BarberAdminItem } from "@/features/barbers/use-barbers-admin";
import { BarberFormDialog } from "@/features/barbers/BarberFormDialog";
import { useTenantSettings } from "@/features/tenant-settings/use-tenant-settings";
import { apiBaseUrl } from "@/lib/env";

export default function BarberosPage() {
  const { data: barbers, isLoading } = useBarbersAdmin();
  const updateBarber = useUpdateBarber();
  const { data: tenant } = useTenantSettings();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<BarberAdminItem | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<BarberAdminItem | null>(null);

  function openCreate() {
    setEditingBarber(null);
    setFormOpen(true);
  }

  function openEdit(barber: BarberAdminItem) {
    setEditingBarber(barber);
    setFormOpen(true);
  }

  async function handleToggle(barber: BarberAdminItem) {
    if (barber.isAvailable) {
      setConfirmTarget(barber);
      return;
    }
    await updateBarber.mutateAsync({ id: barber.id, input: { isAvailable: true } });
  }

  async function confirmDeactivate() {
    if (!confirmTarget) return;
    await updateBarber.mutateAsync({ id: confirmTarget.id, input: { isAvailable: false } });
    setConfirmTarget(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {tenant?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${apiBaseUrl}${tenant.logoUrl}`}
              alt={tenant.name}
              className="h-10 w-10 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Barberos</h1>
            <p className="text-sm text-muted-foreground">Equipo de barberos de la barberia.</p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo barbero
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Equipo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && <p className="px-5 pb-5 text-sm text-muted-foreground">Cargando...</p>}
          {!isLoading && barbers?.length === 0 && (
            <p className="px-5 pb-5 text-sm text-muted-foreground">Aun no hay barberos cargados.</p>
          )}
          {!isLoading && barbers && barbers.length > 0 && (
            <>
              {/* Mobile: stacked cards */}
              <div className="flex flex-col divide-y divide-border md:hidden">
                {barbers.map((barber) => (
                  <div key={barber.id} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{barber.displayName}</p>
                      <p className="truncate text-sm text-muted-foreground">{barber.user.email}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={
                            barber.currentStatus === "IN_SERVICE"
                              ? "success"
                              : barber.currentStatus === "WAITING"
                                ? "warning"
                                : "primary"
                          }
                        >
                          {barber.currentStatus === "IN_SERVICE"
                            ? "En servicio"
                            : barber.currentStatus === "WAITING"
                              ? "En espera"
                              : "Disponible"}
                        </Badge>
                        <Badge variant={barber.isAvailable ? "success" : "default"}>
                          {barber.isAvailable ? "Activo" : "Inactivo"}
                        </Badge>
                        <Badge variant="warning">{Number(barber.commissionPercent)}% comision</Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(barber)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem destructive={barber.isAvailable} onClick={() => handleToggle(barber)}>
                          {barber.isAvailable ? "Desactivar" : "Activar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Disponibilidad</TableHead>
                      <TableHead>Comision</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {barbers.map((barber) => (
                      <TableRow key={barber.id}>
                        <TableCell className="font-medium text-foreground">{barber.displayName}</TableCell>
                        <TableCell className="text-muted-foreground">{barber.user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              barber.currentStatus === "IN_SERVICE"
                                ? "success"
                                : barber.currentStatus === "WAITING"
                                  ? "warning"
                                  : "primary"
                            }
                          >
                            {barber.currentStatus === "IN_SERVICE"
                              ? "En servicio"
                              : barber.currentStatus === "WAITING"
                                ? "En espera"
                                : "Disponible"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={barber.isAvailable ? "success" : "default"}>
                            {barber.isAvailable ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {Number(barber.commissionPercent)}% / {100 - Number(barber.commissionPercent)}%
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(barber)}>Editar</DropdownMenuItem>
                              <DropdownMenuItem
                                destructive={barber.isAvailable}
                                onClick={() => handleToggle(barber)}
                              >
                                {barber.isAvailable ? "Desactivar" : "Activar"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <BarberFormDialog open={formOpen} onOpenChange={setFormOpen} barber={editingBarber} />

      <AlertDialog open={Boolean(confirmTarget)} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar barbero</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget?.displayName} dejara de estar disponible para recibir nuevos servicios. Su
              historial no se ve afectado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate}>Desactivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
