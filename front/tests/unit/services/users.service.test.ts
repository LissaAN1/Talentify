import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

vi.mock("@/services/api-client", () => ({
    apiClient: {
        get: vi.fn(),
        put: vi.fn(),
    },
}));

import { AppRoles } from "@/constants/app-roles";
import { apiClient } from "@/services/api-client";
import { usersService } from "@/services/users.service";
import type { UpdateUserDto, User } from "@/interfaces/user";

const mockedApiClient = apiClient as unknown as {
    get: Mock;
    put: Mock;
};

const mockUser: User = {
    id: "user-1",
    name: "Usuario Test",
    email: "usuario@u.icesi.edu.co",
    roles: [AppRoles.CLIENT],
    isActive: true,
    createdAt: "2026-05-31T10:00:00.000Z",
    updatedAt: "2026-05-31T10:00:00.000Z",
    isTwoFactorEnabled: false,
};

describe("usersService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("getMe llama a GET /users/me y retorna el usuario autenticado", async () => {
        mockedApiClient.get.mockResolvedValue({ data: mockUser });

        const result = await usersService.getMe();

        expect(mockedApiClient.get).toHaveBeenCalledWith("/users/me");
        expect(result).toEqual(mockUser);
    });

    it("updateMe llama a PUT /users/me con el payload recibido", async () => {
        const payload: UpdateUserDto = {
            name: "Usuario Actualizado",
        };

        const updatedUser: User = {
            ...mockUser,
            name: "Usuario Actualizado",
        };

        mockedApiClient.put.mockResolvedValue({ data: updatedUser });

        const result = await usersService.updateMe(payload);

        expect(mockedApiClient.put).toHaveBeenCalledWith("/users/me", payload);
        expect(result).toEqual(updatedUser);
    });

    it("propaga errores del apiClient", async () => {
        const error = new Error("No se pudieron cargar los usuarios.");

        mockedApiClient.get.mockRejectedValue(error);

        await expect(usersService.getMe()).rejects.toThrow(
            "No se pudieron cargar los usuarios."
        );
    });
});

