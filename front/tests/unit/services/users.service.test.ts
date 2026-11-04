import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

vi.mock("@/services/api-client", () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

import { AppRoles } from "@/constants/app-roles";
import { apiClient } from "@/services/api-client";
import { usersService } from "@/services/users.service";
import type { CreateUserDto, UpdateUserDto, UpdateUserRolesDto, User } from "@/interfaces/user";

const mockedApiClient = apiClient as unknown as {
    get: Mock;
    post: Mock;
    put: Mock;
    patch: Mock;
    delete: Mock;
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

    it("findAll llama a GET /users y retorna la lista de usuarios", async () => {
        const users = [
            mockUser,
            {
                ...mockUser,
                id: "user-2",
                email: "admin@u.icesi.edu.co",
                roles: [AppRoles.ADMIN],
            },
        ];

        mockedApiClient.get.mockResolvedValue({ data: users });

        const result = await usersService.findAll();

        expect(mockedApiClient.get).toHaveBeenCalledWith("/users");
        expect(result).toEqual(users);
    });

    it("findOne llama a GET /users/:id y retorna un usuario", async () => {
        mockedApiClient.get.mockResolvedValue({ data: mockUser });

        const result = await usersService.findOne("user-1");

        expect(mockedApiClient.get).toHaveBeenCalledWith("/users/user-1");
        expect(result).toEqual(mockUser);
    });

    it("create llama a POST /users con el DTO de creación", async () => {
        const payload: CreateUserDto = {
            name: "Nuevo Usuario",
            email: "nuevo@u.icesi.edu.co",
            password: "Password123",
            roles: [AppRoles.CLIENT],
        };

        const createdUser: User = {
            ...mockUser,
            id: "user-3",
            name: payload.name,
            email: payload.email,
            roles: payload.roles ?? [AppRoles.CLIENT],
        };

        mockedApiClient.post.mockResolvedValue({ data: createdUser });

        const result = await usersService.create(payload);

        expect(mockedApiClient.post).toHaveBeenCalledWith("/users", payload);
        expect(result).toEqual(createdUser);
    });

    it("update llama a PUT /users/:id con el DTO de actualización", async () => {
        const payload: UpdateUserDto = {
            name: "Nombre Editado",
            password: "Password456",
        };

        const updatedUser: User = {
            ...mockUser,
            name: "Nombre Editado",
        };

        mockedApiClient.put.mockResolvedValue({ data: updatedUser });

        const result = await usersService.update("user-1", payload);

        expect(mockedApiClient.put).toHaveBeenCalledWith("/users/user-1", payload);
        expect(result).toEqual(updatedUser);
    });

    it("updateRoles llama a PATCH /users/:id/roles con los roles nuevos", async () => {
        const payload: UpdateUserRolesDto = {
            roles: [AppRoles.ADMIN, AppRoles.PROVIDER],
        };

        const updatedUser: User = {
            ...mockUser,
            roles: payload.roles,
        };

        mockedApiClient.patch.mockResolvedValue({ data: updatedUser });

        const result = await usersService.updateRoles("user-1", payload);

        expect(mockedApiClient.patch).toHaveBeenCalledWith(
            "/users/user-1/roles",
            payload
        );

        expect(result).toEqual(updatedUser);
    });

    it("delete llama a DELETE /users/:id y retorna el usuario desactivado", async () => {
        const deletedUser: User = {
            ...mockUser,
            isActive: false,
        };

        mockedApiClient.delete.mockResolvedValue({ data: deletedUser });

        const result = await usersService.delete("user-1");

        expect(mockedApiClient.delete).toHaveBeenCalledWith("/users/user-1");
        expect(result).toEqual(deletedUser);
    });

    it("propaga errores del apiClient", async () => {
        const error = new Error("No se pudieron cargar los usuarios.");

        mockedApiClient.get.mockRejectedValue(error);

        await expect(usersService.findAll()).rejects.toThrow(
            "No se pudieron cargar los usuarios."
        );
    });
});

