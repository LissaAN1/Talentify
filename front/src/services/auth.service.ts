import { apiClient } from "@/services/api-client";
import { AppRoles } from "@/constants/app-roles";
import { Login2FAResponse, LoginResponse, ProfileResponse, TwoFactorEnableResponse, TwoFactorQRResponse, Verify2FADto } from "@/interfaces/auth";
import { CreateUserDto, User } from "@/interfaces/user";

class AuthService {
    // Registro de usuario
    async register(createUserDto: CreateUserDto): Promise<User> {
        const response = await apiClient.post<User>("/auth/register", createUserDto);
        return response.data;
    }

    // Login - puede retornar token completo o partialToken si tiene 2FA
    async login(email: string, password: string): Promise<LoginResponse | Login2FAResponse> {
        const response = await apiClient.post<LoginResponse | Login2FAResponse>(
            "/auth/login",
            { email, password }
        );
        return response.data;
    }

    // Obtener perfil del usuario autenticado
    async getProfile(): Promise<ProfileResponse> {
        const response = await apiClient.get<ProfileResponse>("/auth/profile");
        return response.data;
    }

    // Cerrar sesion
    async logout(): Promise<{ mensaje: string }> {
        const response = await apiClient.post<{ mensaje: string }>("/auth/logout");
        return response.data;
    }

    // Endpoints de ejemplo protegidos por rol
    async getProviderDashboard(): Promise<{ mensaje: string; usuario: User }> {
        const response = await apiClient.get<{ mensaje: string; usuario: User }>("/auth/provider/dashboard");
        return response.data;
    }

    async getClientDashboard(): Promise<{ mensaje: string; usuario: User }> {
        const response = await apiClient.get<{ mensaje: string; usuario: User }>("/auth/client/dashboard");
        return response.data;
    }

    async getMarketplace(): Promise<{ mensaje: string; roles: AppRoles[] }> {
        const response = await apiClient.get<{ mensaje: string; roles: AppRoles[] }>("/auth/marketplace");
        return response.data;
    }
    // 2FA
    async generate2FAQR(): Promise<TwoFactorQRResponse> {
        const response = await apiClient.get<TwoFactorQRResponse>("/auth/2fa/generar");
        return response.data;
    }

    async enable2FA(verify2faDto: Verify2FADto): Promise<TwoFactorEnableResponse> {
        const response = await apiClient.post<TwoFactorEnableResponse>("/auth/2fa/habilitar", verify2faDto);
        return response.data;
    }

    async verify2FA(verify2faDto: Verify2FADto, partialToken: string): Promise<LoginResponse> {
        const response = await apiClient.post<LoginResponse>("/auth/2fa/verificar", verify2faDto, {
            headers: { Authorization: `Bearer ${partialToken}` },
        });
        return response.data;
    }
}

export const authService = new AuthService();
