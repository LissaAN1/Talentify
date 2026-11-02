"use client";

import React, { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/services/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { useService } from "@/hooks/useService";
import { useDeleteService } from "@/hooks/useDeleteService";
import { formatCurrencyCOP, formatDate } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export default function ServiceDetailPage({ params }: Props) {
    const { id } = React.use(params);
    const { service, isLoading, error } = useService(id);
    const { user, isAdmin } = useAuth();
    const { deleteService, isLoading: isDeleting, error: deleteError } = useDeleteService();


    const router = useRouter();


    const [open, setOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const handleDelete = async () => {
        if (!service) return;
        const ok = await deleteService(service.id);
        if (ok) {
            setSuccessMessage("El servicio fue desactivado correctamente.");
            setOpen(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="w-fit"
                >
                    ← Volver
                </Button>
                <PageHeader eyebrow="Servicios" title="Detalle del servicio" />
                <Card className="space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-24 w-full" />
                </Card>
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="space-y-8">
                <PageHeader eyebrow="Servicios" title="Detalle del servicio" />
                <Alert variant="danger" title="No fue posible cargar el servicio" message={error || "Servicio no encontrado."} />
                <EmptyState
                    title="Servicio no disponible"
                    description="No fue posible consultar el detalle del servicio."
                    action={<Button href="/services" variant="secondary">Volver a servicios</Button>}
                />
            </div>
        );
    }

    const canManage =
        Boolean(user) &&
        (
            isAdmin() ||
            service.provider?.id === user?.id
        );
    return (
        <div className="space-y-8">
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="w-fit"
            >
                ← Volver
            </Button>
            <PageHeader
                eyebrow="Servicios"
                title={service.title}
                description="Consulta la información completa del servicio."
                action={
                    <div className="flex flex-wrap gap-3">
                        {!canManage && service.isActive && (
                            <Button href={`/orders/new?serviceId=${service.id}&amount=${service.price}`}>
                                Hacer pedido
                            </Button>
                        )}

                        {canManage && (
                            <>
                                <Button href={`/services/${service.id}/edit`} variant="secondary">
                                    <Pencil className="h-4 w-4" />
                                    Editar
                                </Button>

                                {service.isActive && (
                                    <Button
                                        variant="danger"
                                        type="button"
                                        onClick={() => setOpen(true)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Desactivar
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                }
            />
            {successMessage && <Alert variant="success" title="Operación realizada" message={successMessage} />}
            {deleteError && <Alert variant="danger" title="No fue posible desactivar el servicio" message={deleteError} />}
            <Card className="space-y-6">
                <div className="flex flex-wrap gap-2">
                    <Badge variant={service.isActive ? "success" : "warning"}>{service.isActive ? "Activo" : "Inactivo"}</Badge>
                    <Badge variant="neutral">{service.category}</Badge>
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-950">Descripción</h2>
                    <p className="mt-2 leading-7 text-slate-600">{service.description}</p>
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-950">Precio</h2>
                    <p className="mt-1 text-slate-600">{formatCurrencyCOP(service.price)}</p>
                </div>
                {service.provider && (
                    <div>
                        <h2 className="text-lg font-black text-slate-950">Ofrecido por</h2>
                        <p className="mt-1 text-slate-600">{service.provider.name}</p>
                        <p className="text-sm text-slate-400">{service.provider.email}</p>
                    </div>
                )}
                {service.createdAt && (
                    <div>
                        <h2 className="text-lg font-black text-slate-950">Creado</h2>
                        <p className="mt-1 text-sm text-slate-400">{formatDate(service.createdAt)}</p>
                    </div>
                )}
            </Card>
            <ConfirmDialog
                open={open}
                title="Desactivar servicio"
                description={`¿Deseas desactivar "${service.title}"? Esta acción se puede revertir editando el servicio.`}
                confirmText="Sí, desactivar"
                cancelText="Cancelar"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setOpen(false)}
            />
        </div>
    );
}
