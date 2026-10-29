import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const storeMocks = vi.hoisted(() => ({
    clearUser: vi.fn(),
}));

const routerMock = vi.hoisted(() => ({
    push: vi.fn(),
}));

const authServiceMock = vi.hoisted(() => ({
    logout: vi.fn(),
}));

const cookiesMock = vi.hoisted(() => ({
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
            isAuthenticated: true,
            isLoading: false,
            setUser: vi.fn(),
            setToken: vi.fn(),
            setLoading: vi.fn(),
            ...storeMocks,
        }),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => routerMock,
}));

vi.mock("@/services/auth.service", () => ({
    authService: authServiceMock,
}));

vi.mock("js-cookie", () => ({
    default: cookiesMock,
}));

import { useLogout } from "@/hooks/useLogout";

describe("useLogout", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("cierra sesión en backend, limpia cookies, limpia store y redirige al login", async () => {
        authServiceMock.logout.mockResolvedValue({ mensaje: "Sesión cerrada" });

        const { result } = renderHook(() => useLogout());

        await act(async () => {
            await result.current.logout();
        });

        expect(authServiceMock.logout).toHaveBeenCalled();

        expect(cookiesMock.remove).toHaveBeenCalledWith("token");
        expect(cookiesMock.remove).toHaveBeenCalledWith("currentUser");
        expect(cookiesMock.remove).toHaveBeenCalledWith("partialToken");

        expect(storeMocks.clearUser).toHaveBeenCalled();
        expect(routerMock.push).toHaveBeenCalledWith("/login");
    });

    it("aunque falle el logout del backend, limpia sesión local y redirige", async () => {
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        authServiceMock.logout.mockRejectedValue(new Error("Backend caído"));

        const { result } = renderHook(() => useLogout());

        await act(async () => {
            await result.current.logout();
        });

        expect(consoleErrorSpy).toHaveBeenCalled();

        expect(cookiesMock.remove).toHaveBeenCalledWith("token");
        expect(cookiesMock.remove).toHaveBeenCalledWith("currentUser");
        expect(cookiesMock.remove).toHaveBeenCalledWith("partialToken");

        expect(storeMocks.clearUser).toHaveBeenCalled();
        expect(routerMock.push).toHaveBeenCalledWith("/login");

        consoleErrorSpy.mockRestore();
    });
});
