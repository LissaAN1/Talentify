"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateServiceDto } from "@/interfaces/service";
import { servicesService } from "@/services/services.service";

export function useCreateService() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const createService = async (dto: CreateServiceDto): Promise<boolean> => {
        setIsLoading(true);
        setError("");
        try {
            const created = await servicesService.create(dto);
            router.push(`/services/${created.id}`);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : "No fue posible crear el servicio.");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return { createService, isLoading, error };
}
