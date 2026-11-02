"use client";

import { useState } from "react";
import { servicesService } from "@/services/services.service";

export function useDeleteService() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const deleteService = async (id: string): Promise<boolean> => {
        setIsLoading(true);
        setError("");
        try {
            await servicesService.remove(id);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : "No fue posible desactivar el servicio.");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return { deleteService, isLoading, error };
}
