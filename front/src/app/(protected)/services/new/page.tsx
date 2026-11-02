"use client";

import { ServiceForm }  from "@/components/services/ServiceForm";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCreateService } from "@/hooks/useCreateService";
import { CreateServiceDto, UpdateServiceDto } from "@/interfaces/service";

export default function NewServicePage() {
    const { createService, isLoading, error } = useCreateService();

    const handleSubmit = async (dto: CreateServiceDto | UpdateServiceDto) => {
        await createService(dto as CreateServiceDto);
    };

    return (
        <div className="space-y-8">
            <PageHeader
                eyebrow="Servicios"
                title="Crear servicio"
                description="Completa la información para publicar un nuevo servicio en la plataforma."
            />
            <ServiceForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                error={error}
                submitText="Publicar servicio"
            />
        </div>
    );
}
