"use client";

import { useCallback, useEffect, useState } from "react";
import { Service } from "@/interfaces/service";
import { servicesService } from "@/services/services.service";

function getErrorMessage(err: unknown) {
    return err instanceof Error ? err.message : "No fue posible cargar el servicio.";
}

export function useService(id: string) {
    const [service, setService] = useState<Service | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Recarga manual del servicio.
    const getService = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const data = await servicesService.findOne(id);
            setService(data);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    // Carga inicial (y cada vez que cambia el id): solo se actualiza el estado
    // cuando responde la petición, no de forma síncrona dentro del efecto.
    useEffect(() => {
        let activo = true;

        servicesService
            .findOne(id)
            .then((data) => {
                if (activo) {
                    setService(data);
                    setError("");
                }
            })
            .catch((err) => {
                if (activo) setError(getErrorMessage(err));
            })
            .finally(() => {
                if (activo) setIsLoading(false);
            });

        return () => {
            activo = false;
        };
    }, [id]);

    return { service, isLoading, error, getService };
}
