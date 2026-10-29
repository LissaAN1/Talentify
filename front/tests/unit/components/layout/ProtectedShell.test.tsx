import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppRoles } from "@/constants/app-roles";

const replaceMock = vi.hoisted(() => vi.fn());
const usePathnameMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        replace: replaceMock,
    }),
    usePathname: () => usePathnameMock(),
}));

vi.mock("@/components/layout/Navbar", () => ({
    Navbar: () => <aside data-testid="navbar">Navbar mock</aside>,
}));

vi.mock("@/hooks/useAuth", () => ({
    useAuth: useAuthMock,
}));

import { ProtectedShell } from "@/components/layout/ProtectedShell";

function mockAuth({
    isAuthenticated,
    isLoading,
    hasRole,
}: {
    isAuthenticated: boolean;
    isLoading: boolean;
    hasRole: ReturnType<typeof vi.fn>;
}) {
    useAuthMock.mockReturnValue({
        isAuthenticated,
        isLoading,
        hasRole,
    });
}

describe("ProtectedShell", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        usePathnameMock.mockReturnValue("/dashboard");
    });

    it("muestra skeleton mientras carga la sesión", () => {
        mockAuth({
            isAuthenticated: false,
            isLoading: true,
            hasRole: vi.fn().mockReturnValue(false),
        });

        const { container } = render(
            <ProtectedShell>
                <p>Contenido protegido</p>
            </ProtectedShell>
        );

        expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
        expect(screen.queryByTestId("navbar")).not.toBeInTheDocument();

        expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
        expect(replaceMock).not.toHaveBeenCalled();
    });

    it("redirige al login si el usuario no está autenticado", async () => {
        usePathnameMock.mockReturnValue("/orders/new");

        mockAuth({
            isAuthenticated: false,
            isLoading: false,
            hasRole: vi.fn().mockReturnValue(false),
        });

        render(
            <ProtectedShell>
                <p>Contenido protegido</p>
            </ProtectedShell>
        );

        expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();

        await waitFor(() => {
            expect(replaceMock).toHaveBeenCalledWith(
                "/login?redirect=%2Forders%2Fnew"
            );
        });
    });

    it("redirige a forbidden si está autenticado pero no autorizado", async () => {
        usePathnameMock.mockReturnValue("/users");

        const hasRole = vi.fn().mockReturnValue(false);

        mockAuth({
            isAuthenticated: true,
            isLoading: false,
            hasRole,
        });

        render(
            <ProtectedShell>
                <p>Contenido protegido</p>
            </ProtectedShell>
        );

        expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();

        await waitFor(() => {
            expect(hasRole).toHaveBeenCalledWith([AppRoles.ADMIN]);
            expect(replaceMock).toHaveBeenCalledWith("/forbidden");
        });
    });

    it("renderiza Navbar y children si el usuario está autorizado", () => {
        usePathnameMock.mockReturnValue("/dashboard");

        const hasRole = vi.fn().mockReturnValue(true);

        mockAuth({
            isAuthenticated: true,
            isLoading: false,
            hasRole,
        });

        render(
            <ProtectedShell>
                <p>Contenido protegido</p>
            </ProtectedShell>
        );

        expect(screen.getByTestId("navbar")).toBeInTheDocument();
        expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
        expect(replaceMock).not.toHaveBeenCalled();
    });

    it("pide los roles requeridos de rutas hijas", () => {
        usePathnameMock.mockReturnValue("/services/new");

        const hasRole = vi.fn().mockReturnValue(true);

        mockAuth({
            isAuthenticated: true,
            isLoading: false,
            hasRole,
        });

        render(
            <ProtectedShell>
                <p>Contenido protegido</p>
            </ProtectedShell>
        );

        expect(hasRole).toHaveBeenCalledWith([
            AppRoles.ADMIN,
            AppRoles.PROVIDER,
        ]);
    });
});
