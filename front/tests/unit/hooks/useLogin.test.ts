import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppRoles } from "@/constants/app-roles";

const storeMocks = vi.hoisted(() => ({
    setUser: vi.fn(),
    setToken: vi.fn(),
    clearUser: vi.fn(),
    setLoading: vi.fn(),
}));

const authServiceMock = vi.hoisted(() => ({
    login: vi.fn(),
}));

const cookiesMock = vi.hoisted(() => ({
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
}));

vi.mock("@/providers/user-store-provider", () => ({
    useUserStore: (selector: (state: Record<string, unknown>) => unknown) =>
        selector({
            id: "",
            name: "",
            email: "",
            roles: [],
            token: "",
            isAuthenticated: false,
            isLoading: false,
            ...storeMocks,
        }),
}));

vi.mock("@/services/auth.service", () => ({
    authService: authServiceMock,
}));

vi.mock("js-cookie", () => ({
    default: cookiesMock,
}));

import { useLogin } from "@/hooks/useLogin";

const normalLoginResponse = {
    token: "jwt-token",
    usuario: {
        id: "user-1",
        nombre: "Usuario Test",
        correo: "usuario@u.icesi.edu.co",
        roles: [AppRoles.CLIENT],
    },
};

describe("useLogin", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("realiza login normal, guarda cookies y actualiza el store", async () => {
        authServiceMock.login.mockResolvedValue(normalLoginResponse);

        const { result } = renderHook(() => useLogin());

        let response:
            | { success: boolean; requires2FA?: boolean; partialToken?: string }
            | undefined;

        await act(async () => {
            response = await result.current.login(
                "usuario@u.icesi.edu.co",
                "Password123"
            );
        });

        expect(authServiceMock.login).toHaveBeenCalledWith(
            "usuario@u.icesi.edu.co",
            "Password123"
        );

        expect(cookiesMock.set).toHaveBeenCalledWith("token", "jwt-token", {
            expires: 7,
        });

        expect(cookiesMock.set).toHaveBeenCalledWith(
            "currentUser",
            JSON.stringify({
                id: "user-1",
                name: "Usuario Test",
                email: "usuario@u.icesi.edu.co",
                roles: [AppRoles.CLIENT],
            }),
            { expires: 7 }
        );

        expect(storeMocks.setUser).toHaveBeenCalledWith({
            id: "user-1",
            name: "Usuario Test",
            email: "usuario@u.icesi.edu.co",
            roles: [AppRoles.CLIENT],
            token: "jwt-token",
        });

        expect(storeMocks.setLoading).toHaveBeenNthCalledWith(1, true);
        expect(storeMocks.setLoading).toHaveBeenLastCalledWith(false);

        expect(response).toEqual({ success: true });
    });

    it("retorna requires2FA si el backend exige segundo factor", async () => {
        authServiceMock.login.mockResolvedValue({
            requires2FA: true,
            partialToken: "partial-token",
        });

        const { result } = renderHook(() => useLogin());

        let response:
            | { success: boolean; requires2FA?: boolean; partialToken?: string }
            | undefined;

        await act(async () => {
            response = await result.current.login(
                "usuario@u.icesi.edu.co",
                "Password123"
            );
        });

        expect(response).toEqual({
            success: true,
            requires2FA: true,
            partialToken: "partial-token",
        });

        expect(cookiesMock.set).not.toHaveBeenCalled();
        expect(storeMocks.setUser).not.toHaveBeenCalled();

        expect(storeMocks.setLoading).toHaveBeenNthCalledWith(1, true);
        expect(storeMocks.setLoading).toHaveBeenLastCalledWith(false);
    });

    it("limpia el usuario y propaga el error si login falla", async () => {
        const error = new Error("Credenciales inválidas");

        authServiceMock.login.mockRejectedValue(error);

        const { result } = renderHook(() => useLogin());

        await act(async () => {
            await expect(
                result.current.login("usuario@u.icesi.edu.co", "wrong")
            ).rejects.toThrow("Credenciales inválidas");
        });

        expect(storeMocks.setLoading).toHaveBeenNthCalledWith(1, true);
        expect(storeMocks.setLoading).toHaveBeenLastCalledWith(false);
        expect(storeMocks.clearUser).toHaveBeenCalled();
    });
});
