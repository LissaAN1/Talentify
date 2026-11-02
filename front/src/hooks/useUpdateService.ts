
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UpdateServiceDto } from "@/interfaces/service";
import { servicesService } from "@/services/services.service";

export function useUpdateService(id: string) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const updateService = async (dto: UpdateServiceDto): Promise<boolean> => {
        setIsLoading(true);
        setError("");
        try {
            await servicesService.update(id, dto);
            router.push(`/services/${id}`);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : "No fue posible actualizar el servicio.");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return { updateService, isLoading, error };
}
