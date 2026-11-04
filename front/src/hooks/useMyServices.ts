"use client";

import { useCallback, useEffect, useState } from "react";

import { servicesService } from "@/services/services.service";
import type { Service } from "@/interfaces/service";

function getErrorMessage(err: unknown) {
    return err instanceof Error ? err.message : "No fue posible cargar tus servicios.";
}

export function useMyServices(enabled = true) {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(enabled);
    const [error, setError] = useState("");

    // Recarga manual (por ejemplo, después de desactivar un servicio).
    const getMyServices = useCallback(async () => {
        if (!enabled) {
            setServices([]);
            setIsLoading(false);
            setError("");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const data = await servicesService.findMyServices();
            setServices(data);
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [enabled]);

    // Carga inicial: solo se actualiza el estado cuando responde la petición,
    // no de forma síncrona dentro del efecto.
    useEffect(() => {
        if (!enabled) return;

        let activo = true;

        servicesService
            .findMyServices()
            .then((data) => {
                if (activo) setServices(data);
            })
            .catch((err: unknown) => {
                if (activo) setError(getErrorMessage(err));
            })
            .finally(() => {
                if (activo) setIsLoading(false);
            });

        return () => {
            activo = false;
        };
    }, [enabled]);

    return {
        services,
        isLoading,
        error,
        getMyServices,
    };
}
