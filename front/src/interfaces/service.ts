import { AppRoles } from '@/constants/app-roles';

export enum ServiceCategory {
    DESIGN = 'DESIGN',
    PROGRAMMING = 'PROGRAMMING',
    MARKETING = 'MARKETING',
    VIDEO = 'VIDEO',
    WRITING = 'WRITING',
    PHOTOGRAPHY = 'PHOTOGRAPHY',
}

export enum ServiceStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
    [ServiceCategory.DESIGN]: 'Diseño',
    [ServiceCategory.PROGRAMMING]: 'Programación',
    [ServiceCategory.MARKETING]: 'Marketing',
    [ServiceCategory.VIDEO]: 'Video',
    [ServiceCategory.WRITING]: 'Redacción',
    [ServiceCategory.PHOTOGRAPHY]: 'Fotografía',
};

export const serviceCategoryLabels = CATEGORY_LABELS;

export const serviceCategoryOptions = Object.values(ServiceCategory).map(
    (value) => ({ value, label: CATEGORY_LABELS[value] })
);

export interface ServiceProvider {
    id: string;
    name: string;
    email: string;
    roles: AppRoles[];
}

/**
 * Interfaz interna del frontend para un servicio.
 * `isActive` se mapea desde `status` del backend en services.service.ts.
 */
export interface Service {
    id: string;
    title: string;
    description: string;
    category: ServiceCategory;
    price: number;
    /** Estado crudo del backend: ACTIVE | INACTIVE */
    status: ServiceStatus;
    /** Campo computado: true si status === ACTIVE */
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    provider?: ServiceProvider;
}

export interface CreateServiceDto {
    title: string;
    description: string;
    category: ServiceCategory;
    price: number;
}

export interface UpdateServiceDto {
    title?: string;
    description?: string;
    category?: ServiceCategory;
    price?: number;
    /** Solo admins pueden cambiar el status */
    status?: ServiceStatus;
}
