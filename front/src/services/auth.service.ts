import { apiClient } from "@/services/api-client";
import { CreateUserDto, User } from "@/interfaces/user";

class AuthService {
    // Registro de usuario
    async register(createUserDto: CreateUserDto): Promise<User> {
        const response = await apiClient.post<User>("/auth/register", createUserDto);
        return response.data;
    }
}

export const authService = new AuthService();
