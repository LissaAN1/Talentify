import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

vi.mock("@/services/api-client", () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

import { AppRoles } from "@/constants/app-roles";
import { apiClient } from "@/services/api-client";
import { authService } from "@/services/auth.service";
import type {
    Login2FAResponse,
    LoginResponse,
    ProfileResponse,
} from "@/interfaces/auth";
import type { CreateUserDto, User } from "@/interfaces/user";

const mockedApiClient = apiClient as unknown as {
    get: Mock;
    post: Mock;
};

const mockUser: User = {
    id: "user-1",
    name: "Usuario Test",
    email: "usuario@u.icesi.edu.co",
    roles: [AppRoles.CLIENT],
    isActive: true,
};

const mockLoginResponse: LoginResponse = {
    token: "jwt-token",
    usuario: {
        id: "user-1",
        nombre: "Usuario Test",
        correo: "usuario@u.icesi.edu.co",
        roles: [AppRoles.CLIENT],
    },
};

describe("authService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("register llama a POST /auth/register", async () => {
        const payload: CreateUserDto = {
            name: "Usuario Test",
            email: "usuario@u.icesi.edu.co",
            password: "Password123",
            roles: [AppRoles.CLIENT],
        };

        mockedApiClient.post.mockResolvedValue({ data: mockUser });

        const result = await authService.register(payload);

        expect(mockedApiClient.post).toHaveBeenCalledWith("/auth/register", payload);
        expect(result).toEqual(mockUser);
    });

    it("login llama a POST /auth/login con email y password", async () => {
        mockedApiClient.post.mockResolvedValue({ data: mockLoginResponse });

        const result = await authService.login(
            "usuario@u.icesi.edu.co",
            "Password123"
        );

        expect(mockedApiClient.post).toHaveBeenCalledWith("/auth/login", {
            email: "usuario@u.icesi.edu.co",
            password: "Password123",
        });

        expect(result).toEqual(mockLoginResponse);
    });

    it("login puede retornar respuesta de 2FA", async () => {
        const response2FA: Login2FAResponse = {
            requires2FA: true,
            partialToken: "partial-token",
        };

        mockedApiClient.post.mockResolvedValue({ data: response2FA });

        const result = await authService.login(
            "usuario@u.icesi.edu.co",
            "Password123"
        );

        expect(result).toEqual(response2FA);
    });

    it("getProfile llama a GET /auth/profile", async () => {
        const profile: ProfileResponse = {
            mensaje: "Perfil obtenido",
            usuario: mockLoginResponse.usuario,
        };

        mockedApiClient.get.mockResolvedValue({ data: profile });

        const result = await authService.getProfile();

        expect(mockedApiClient.get).toHaveBeenCalledWith("/auth/profile");
        expect(result).toEqual(profile);
    });

    it("logout llama a POST /auth/logout", async () => {
        const response = { mensaje: "Sesión cerrada" };

        mockedApiClient.post.mockResolvedValue({ data: response });

        const result = await authService.logout();

        expect(mockedApiClient.post).toHaveBeenCalledWith("/auth/logout");
        expect(result).toEqual(response);
    });

    it("getProviderDashboard llama a GET /auth/provider/dashboard", async () => {
        const response = { mensaje: "Provider dashboard", usuario: mockUser };

        mockedApiClient.get.mockResolvedValue({ data: response });

        const result = await authService.getProviderDashboard();

        expect(mockedApiClient.get).toHaveBeenCalledWith("/auth/provider/dashboard");
        expect(result).toEqual(response);
    });

    it("getClientDashboard llama a GET /auth/client/dashboard", async () => {
        const response = { mensaje: "Client dashboard", usuario: mockUser };

        mockedApiClient.get.mockResolvedValue({ data: response });

        const result = await authService.getClientDashboard();

        expect(mockedApiClient.get).toHaveBeenCalledWith("/auth/client/dashboard");
        expect(result).toEqual(response);
    });

    it("getMarketplace llama a GET /auth/marketplace", async () => {
        const response = {
            mensaje: "Marketplace autorizado",
            roles: [AppRoles.CLIENT],
        };

        mockedApiClient.get.mockResolvedValue({ data: response });

        const result = await authService.getMarketplace();

        expect(mockedApiClient.get).toHaveBeenCalledWith("/auth/marketplace");
        expect(result).toEqual(response);
    });

    it("propaga errores del apiClient", async () => {
        const error = new Error("Credenciales inválidas");

        mockedApiClient.post.mockRejectedValue(error);

        await expect(
            authService.login("usuario@u.icesi.edu.co", "wrong")
        ).rejects.toThrow("Credenciales inválidas");
    });
});
