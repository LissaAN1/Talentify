import { AppRoles } from "@/constants/app-roles";

export interface User {
    id: string;
    name: string;
    email: string;
    roles: AppRoles[];
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    refreshToken?: string | null;
    isTwoFactorEnabled?: boolean;
}

export interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    roles?: AppRoles[];
}

export interface UpdateUserDto {
    name?: string;
    password?: string;
}

export interface UpdateUserRolesDto {
    roles: AppRoles[];
}
