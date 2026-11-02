"use client";

import { useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/services/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

import { useDeleteService } from "@/hooks/useDeleteService";
import { useMyServices } from "@/hooks/useMyServices";
import { useServices } from "@/hooks/useServices";

import { formatCurrencyCOP } from "@/lib/format";
import { Service } from "@/interfaces/service";

type ServiceListProps = {
    title: string;
    description: string;
    services: Service[];
    isLoading: boolean;
    onDeleteClick: (service: Service) => void;
    allowManagement?: boolean;
};

function ServiceListSkeleton() {
    return (
        <div className="grid gap-5 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="space-y-4">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-8 w-32" />
                </Card>
            ))}
        </div>
    );
}

function ServiceList({ title, description, services, isLoading, onDeleteClick, allowManagement = false }: ServiceListProps) {
    if (isLoading) {
        return (
            <section className="space-y-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-950">{title}</h2>
                    <p className="mt-2 text-slate-600">{description}</p>
                </div>
                <ServiceListSkeleton />
            </section>
        );
    }

    if (services.length === 0) {
        return (
            <section className="space-y-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-950">{title}</h2>
                    <p className="mt-2 text-slate-600">{description}</p>
                </div>
                <EmptyState
                    title="No hay servicios para mostrar"
                    description="Cuando existan publicaciones disponibles aparecerán aquí."
                />
            </section>
        );
    }

    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-2xl font-black text-slate-950">{title}</h2>
                <p className="mt-2 text-slate-600">{description}</p>
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
                {services.map((service) => (
                    <Card key={service.id} className="space-y-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-xl font-black text-slate-950">{service.title}</h3>
                                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                                    {service.description}
                                </p>
                            </div>
                            <Badge variant={service.isActive ? "success" : "warning"}>
                                {service.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="neutral">{service.category}</Badge>
                            <Badge variant="blue">{formatCurrencyCOP(service.price)}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button href={`/services/${service.id}`} variant="secondary" size="sm">
                                <Eye className="h-4 w-4" />
                                Ver detalle
                            </Button>
                            {allowManagement && (
                                <>
                                    <Button href={`/services/${service.id}/edit`} variant="ghost" size="sm">
                                        <Pencil className="h-4 w-4" />
                                        Editar
                                    </Button>

                                    {service.isActive && (
                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            onClick={() => onDeleteClick(service)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Desactivar
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </section>
    );
}

export default function ServicesPage() {
    const { isAdmin, isProvider } = useAuth();

    const userIsAdmin = isAdmin();
    const userIsProvider = isProvider();

    const { services, isLoading, error, getServices } = useServices();
    const { services: myServices, isLoading: isLoadingMine, error: myServicesError, getMyServices } = useMyServices(userIsProvider);
    const { deleteService, isLoading: isDeleting, error: deleteError } = useDeleteService();

    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [successMessage, setSuccessMessage] = useState("");

    const handleDelete = async () => {
        if (!selectedService) return;

        const ok = await deleteService(selectedService.id);

        if (ok) {
            setSuccessMessage(`El servicio "${selectedService.title}" fue desactivado correctamente.`);
            setSelectedService(null);

            await getServices();

            if (userIsProvider) {
                await getMyServices();
            }
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                eyebrow="Servicios"
                title="Gestión de servicios"
                description="Administra las publicaciones y consulta el catálogo de la plataforma."
                action={
                    (userIsProvider || userIsAdmin) ? (
                        <Button href="/services/new">
                            <Plus className="h-4 w-4" />
                            Nuevo servicio
                        </Button>
                    ) : null
                }
            />
            {successMessage && <Alert variant="success" title="Operación realizada" message={successMessage} />}
            {error && <Alert variant="danger" title="No fue posible cargar los servicios" message={error} />}
            {userIsProvider && myServicesError && <Alert variant="danger" title="No fue posible cargar tus servicios" message={myServicesError} />}
            {deleteError && <Alert variant="danger" title="No fue posible desactivar el servicio" message={deleteError} />}
            <ServiceList
                title="Servicios disponibles"
                description="Consulta el listado general de servicios registrados."
                services={services.filter((s) => s.isActive)}
                isLoading={isLoading}
                onDeleteClick={setSelectedService}
                allowManagement={false}
            />
            {userIsProvider && (
                <ServiceList
                    title="Mis servicios"
                    description="Gestiona los servicios publicados por tu cuenta de proveedor."
                    services={myServices}
                    isLoading={isLoadingMine}
                    onDeleteClick={setSelectedService}
                    allowManagement={true}
                />
            )}
            <ConfirmDialog
                open={Boolean(selectedService)}
                title="Desactivar servicio"
                description={selectedService ? `¿Deseas desactivar "${selectedService.title}"?` : ""}
                confirmText="Sí, desactivar"
                cancelText="Cancelar"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setSelectedService(null)}
            />
        </div>
    );
}
