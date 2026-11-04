"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { ServiceForm } from "@/components/services/ServiceForm";
import { PageHeader } from "@/components/shared/PageHeader";
import { useService } from "@/hooks/useService";
import { useUpdateService } from "@/hooks/useUpdateService";
import { UpdateServiceDto } from "@/interfaces/service";
import {Button} from "@/components/ui/Button";

type Props = { params: Promise<{ id: string }> };

export default function EditServicePage({ params }: Props) {
    const { id } = React.use(params);
    const { service, isLoading, error: loadError } = useService(id);
    const { updateService, isLoading: isUpdating, error: updateError } = useUpdateService(id);

    const router = useRouter();



    const handleSubmit = async (dto: UpdateServiceDto) => {
        await updateService(dto);
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
                <PageHeader eyebrow="Servicios" title="Editar servicio" />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        );
    }

    if (loadError || !service) {
        return (
            <div className="space-y-8">
                <PageHeader eyebrow="Servicios" title="Editar servicio" />
                <Alert variant="danger" title="No fue posible cargar el servicio" message={loadError || "Servicio no encontrado."} />
            </div>
        );
    }

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
                title="Editar servicio"
                description="Modifica la información del servicio publicado."
            />
            <ServiceForm
                initialValues={service}
                onSubmit={handleSubmit}
                isLoading={isUpdating}
                error={updateError}
                submitText="Guardar cambios"
                cancelHref={`/services/${service.id}`}
            />
        </div>
    );
}
