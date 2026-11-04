import { apiClient } from '@/services/api-client';
import {
    CreateServiceDto,
    Service,
    ServiceStatus,
    UpdateServiceDto,
} from '@/interfaces/service';

// Forma en que el backend devuelve un servicio.
// El campo status (ACTIVE/INACTIVE) se mapea a isActive antes de llegar a los componentes.
type RawService = Omit<Service, 'isActive'> & { status: ServiceStatus };

function mapService(raw: RawService): Service {
    return {
        ...raw,
        isActive: raw.status === ServiceStatus.ACTIVE,
    };
}

class ServicesService {
    async findAll(): Promise<Service[]> {
        const response = await apiClient.get<RawService[]>('/services');
        return response.data.map(mapService);
    }

    async findMyServices(): Promise<Service[]> {
        const response = await apiClient.get<RawService[]>('/services/my');
        return response.data.map(mapService);
    }

    async findOne(id: string): Promise<Service> {
        const response = await apiClient.get<RawService>(`/services/${id}`);
        return mapService(response.data);
    }

    async create(createServiceDto: CreateServiceDto): Promise<Service> {
        const response = await apiClient.post<RawService>('/services', createServiceDto);
        return mapService(response.data);
    }

    async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
        const response = await apiClient.put<RawService>(`/services/${id}`, updateServiceDto);
        return mapService(response.data);
    }

    async remove(id: string): Promise<Service> {
        const response = await apiClient.delete<RawService>(`/services/${id}`);
        return mapService(response.data);
    }
}
export const servicesService = new ServicesService();
