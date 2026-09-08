"use client";

import { useState } from "react";
import { MoreHorizontal, Plus, Scissors } from "lucide-react";
import type { ServiceCatalogItem } from "@barberops/shared";
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
import { useAllServices, useUpdateService } from "@/features/services/use-services-admin";
import { ServiceFormDialog } from "@/features/services/ServiceFormDialog";

export default function ServiciosPage() {
  const { data: services, isLoading } = useAllServices();
  const updateService = useUpdateService();

  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalogItem | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ServiceCatalogItem | null>(null);

  function openCreate() {
    setEditingService(null);
    setFormOpen(true);
  }

  function openEdit(service: ServiceCatalogItem) {
    setEditingService(service);
    setFormOpen(true);
  }

  async function handleToggle(service: ServiceCatalogItem) {
    if (service.isActive) {
      setConfirmTarget(service);
      return;
    }
    await updateService.mutateAsync({ id: service.id, input: { isActive: true } });
  }

  async function confirmDeactivate() {
    if (!confirmTarget) return;
    await updateService.mutateAsync({ id: confirmTarget.id, input: { isActive: false } });
    setConfirmTarget(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Servicios</h1>
          <p className="text-sm text-muted-foreground">Catalogo y precios de la barberia.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo servicio
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-primary" />
            Catalogo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && <p className="px-5 pb-5 text-sm text-muted-foreground">Cargando...</p>}
          {!isLoading && services?.length === 0 && (
            <p className="px-5 pb-5 text-sm text-muted-foreground">Aun no hay servicios cargados.</p>
          )}
          {!isLoading && services && services.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Duracion</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium text-foreground">{service.name}</TableCell>
                    <TableCell className="text-muted-foreground">{service.category ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{service.durationEstimateMin} min</TableCell>
                    <TableCell className="font-medium">
                      Gs. {Number(service.currentPrice).toLocaleString("es-PY")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.isActive ? "success" : "default"}>
                        {service.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(service)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem
                            destructive={service.isActive}
                            onClick={() => handleToggle(service)}
                          >
                            {service.isActive ? "Desactivar" : "Activar"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ServiceFormDialog open={formOpen} onOpenChange={setFormOpen} service={editingService} />

      <AlertDialog open={Boolean(confirmTarget)} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar servicio</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget?.name} dejara de estar disponible para que los barberos lo seleccionen. El
              historial de servicios ya realizados no se ve afectado.
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
