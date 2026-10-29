import { apiClient } from "@/services/api-client";
import { Login2FAResponse, LoginResponse, ProfileResponse } from "@/interfaces/auth";
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
}

export const authService = new AuthService();
