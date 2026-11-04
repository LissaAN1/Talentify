"use client";

import { useCallback, useEffect, useState } from "react";
import { Service } from "@/interfaces/service";
import { servicesService } from "@/services/services.service";

function getErrorMessage(err: unknown) {
    return err instanceof Error ? err.message : "No fue posible cargar los servicios.";
}

export function useServices() {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Recarga manual (por ejemplo, después de desactivar un servicio).
    const getServices = useCallback(async () => {
        setIsLoading(true);
        setError("");
        try {
            const data = await servicesService.findAll();
            setServices(data);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Carga inicial: el estado ya arranca en "cargando", por eso aquí solo se
    // actualiza cuando responde la petición (no de forma síncrona dentro del efecto).
    useEffect(() => {
        let activo = true;

        servicesService
            .findAll()
            .then((data) => {
                if (activo) setServices(data);
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
    }, []);

    return { services, isLoading, error, getServices };
}
