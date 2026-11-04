import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppRoles } from "@/constants/app-roles";

const useCurrentUserMock = vi.hoisted(() => vi.fn());
const useLoginMock = vi.hoisted(() => vi.fn());
const useLogoutMock = vi.hoisted(() => vi.fn());

const loginMock = vi.hoisted(() => vi.fn());
const logoutMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useCurrentUser", () => ({
    useCurrentUser: useCurrentUserMock,
}));

vi.mock("@/hooks/useLogin", () => ({
    useLogin: useLoginMock,
}));

vi.mock("@/hooks/useLogout", () => ({
    useLogout: useLogoutMock,
}));

import { useAuth } from "@/hooks/useAuth";

describe("useAuth", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        useLoginMock.mockReturnValue({
            login: loginMock,
        });

        useLogoutMock.mockReturnValue({
            logout: logoutMock,
        });
    });

    it("retorna sesión no autenticada si no hay usuario", () => {
        useCurrentUserMock.mockReturnValue({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        });

        const { result } = renderHook(() => useAuth());

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.isLoading).toBe(false);

        expect(result.current.isAdmin()).toBe(false);
        expect(result.current.isProvider()).toBe(false);
        expect(result.current.isClient()).toBe(false);
        expect(result.current.hasRole([AppRoles.ADMIN])).toBe(false);
    });

    it("identifica correctamente un usuario ADMIN", () => {
        useCurrentUserMock.mockReturnValue({
            user: {
                id: "admin-1",
                name: "Admin Test",
                email: "admin@u.icesi.edu.co",
                roles: [AppRoles.ADMIN],
                token: "admin-token",
            },
            isAuthenticated: true,
            isLoading: false,
        });

        const { result } = renderHook(() => useAuth());

        expect(result.current.isAdmin()).toBe(true);
        expect(result.current.isProvider()).toBe(false);
        expect(result.current.isClient()).toBe(false);
        expect(result.current.hasRole([AppRoles.ADMIN])).toBe(true);
        expect(result.current.hasRole([AppRoles.PROVIDER])).toBe(false);
    });

    it("identifica correctamente un usuario PROVIDER", () => {
        useCurrentUserMock.mockReturnValue({
            user: {
                id: "provider-1",
                name: "Provider Test",
                email: "provider@u.icesi.edu.co",
                roles: [AppRoles.PROVIDER],
                token: "provider-token",
            },
            isAuthenticated: true,
            isLoading: false,
        });

        const { result } = renderHook(() => useAuth());

        expect(result.current.isAdmin()).toBe(false);
        expect(result.current.isProvider()).toBe(true);
        expect(result.current.isClient()).toBe(false);
        expect(result.current.hasRole([AppRoles.ADMIN, AppRoles.PROVIDER])).toBe(true);
    });

    it("identifica correctamente un usuario CLIENT", () => {
        useCurrentUserMock.mockReturnValue({
            user: {
                id: "client-1",
                name: "Client Test",
                email: "client@u.icesi.edu.co",
                roles: [AppRoles.CLIENT],
                token: "client-token",
            },
            isAuthenticated: true,
            isLoading: false,
        });

        const { result } = renderHook(() => useAuth());

        expect(result.current.isAdmin()).toBe(false);
        expect(result.current.isProvider()).toBe(false);
        expect(result.current.isClient()).toBe(true);
        expect(result.current.hasRole([AppRoles.CLIENT])).toBe(true);
    });

    it("expone login y logout desde los hooks internos", () => {
        useCurrentUserMock.mockReturnValue({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        });

        const { result } = renderHook(() => useAuth());

        expect(result.current.login).toBe(loginMock);
        expect(result.current.logout).toBe(logoutMock);
    });
});
