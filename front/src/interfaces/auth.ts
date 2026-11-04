import { AppRoles } from "@/constants/app-roles";

export interface LoginResponse {
    usuario: {
        id: string;
        nombre: string;
        correo: string;
        roles: AppRoles[];
    };
    token: string;
    requires2FA?: boolean;
    partialToken?: string;
}

export interface Login2FAResponse {
    requires2FA: boolean;
    partialToken: string;
}

export interface TwoFactorQRResponse {
    qrCode: string;
}

export interface TwoFactorEnableResponse {
    mensaje: string;
}

export interface Verify2FADto {
    token: string;
}

export interface ProfileResponse {
    mensaje: string;
    usuario: {
        id: string;
        nombre: string;
        correo: string;
        roles: AppRoles[];
    };
}
