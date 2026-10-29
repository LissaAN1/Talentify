import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppRoles } from "@/constants/app-roles";

const useAuthMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useAuth", () => ({
    useAuth: useAuthMock,
}));

vi.mock("@/components/navigation/ActiveLink", () => ({
    ActiveLink: ({
        href,
        label,
        exact,
    }: {
        href: string;
        label: string;
        icon?: unknown;
        exact?: boolean;
    }) => (
        <a href={href} data-exact={exact ? "true" : "false"}>
            {label}
        </a>
    ),
}));

import { Navbar } from "@/components/layout/Navbar";

type MockAuthOptions = {
    roles: AppRoles[];
    name?: string;
    email?: string;
    logout?: () => void;
};

function mockUseAuth({
    roles,
    name = "Usuario Test",
    email = "usuario@u.icesi.edu.co",
    logout = vi.fn(),
}: MockAuthOptions) {
    useAuthMock.mockReturnValue({
        user: {
            id: "user-1",
            name,
            email,
            roles,
            token: "fake-token",
        },
        logout,
        isAdmin: () => roles.includes(AppRoles.ADMIN),
        isProvider: () => roles.includes(AppRoles.PROVIDER),
        isClient: () => roles.includes(AppRoles.CLIENT),
        hasRole: (requiredRoles: AppRoles[]) =>
            requiredRoles.length === 0 ||
            requiredRoles.some((role) => roles.includes(role)),
    });

    return { logout };
}

describe("Navbar", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("muestra datos del usuario autenticado", () => {
        mockUseAuth({
            roles: [AppRoles.CLIENT],
            name: "Cliente Test",
            email: "cliente@u.icesi.edu.co",
        });

        render(<Navbar />);

        expect(screen.getByText("Talent")).toBeInTheDocument();
        expect(screen.getByText("ify")).toBeInTheDocument();
        expect(screen.getByText("Cliente Test")).toBeInTheDocument();
        expect(screen.getByText("cliente@u.icesi.edu.co")).toBeInTheDocument();
        expect(screen.getByText("CLIENT")).toBeInTheDocument();
    });

    it("ADMIN ve todas las opciones del menú", () => {
        mockUseAuth({
            roles: [AppRoles.ADMIN],
            name: "Admin Test",
            email: "admin@u.icesi.edu.co",
        });

        render(<Navbar />);

        expect(screen.getByRole("link", { name: /panel/i })).toHaveAttribute("href", "/dashboard");
        expect(screen.getByRole("link", { name: /marketplace/i })).toHaveAttribute("href", "/marketplace");
        expect(screen.getByRole("link", { name: /servicios/i })).toHaveAttribute("href", "/services");
        expect(screen.getByRole("link", { name: /órdenes/i })).toHaveAttribute("href", "/orders");
        expect(screen.getByRole("link", { name: /usuarios/i })).toHaveAttribute("href", "/users");
        expect(screen.getByRole("link", { name: /perfil/i })).toHaveAttribute("href", "/profile");
    });

    it("PROVIDER ve servicios pero no usuarios", () => {
        mockUseAuth({
            roles: [AppRoles.PROVIDER],
            name: "Proveedor Test",
            email: "provider@u.icesi.edu.co",
        });

        render(<Navbar />);

        expect(screen.getByRole("link", { name: /panel/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /marketplace/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /servicios/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /órdenes/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /perfil/i })).toBeInTheDocument();

        expect(screen.queryByRole("link", { name: /usuarios/i })).not.toBeInTheDocument();
    });

    it("CLIENT no ve servicios ni usuarios", () => {
        mockUseAuth({
            roles: [AppRoles.CLIENT],
            name: "Cliente Test",
            email: "client@u.icesi.edu.co",
        });

        render(<Navbar />);

        expect(screen.getByRole("link", { name: /panel/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /marketplace/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /órdenes/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /perfil/i })).toBeInTheDocument();

        expect(screen.queryByRole("link", { name: /mis servicios/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("link", { name: /usuarios/i })).not.toBeInTheDocument();
    });

    it("marca el link de dashboard como exact", () => {
        mockUseAuth({
            roles: [AppRoles.ADMIN],
        });

        render(<Navbar />);

        expect(screen.getByRole("link", { name: /panel/i })).toHaveAttribute("data-exact", "true");
        expect(screen.getByRole("link", { name: /marketplace/i })).toHaveAttribute("data-exact", "false");
    });

    it("ejecuta logout al hacer clic en cerrar sesión", () => {
        const logout = vi.fn();

        mockUseAuth({
            roles: [AppRoles.ADMIN],
            logout,
        });

        render(<Navbar />);

        fireEvent.click(screen.getByRole("button", { name: /cerrar sesión/i }));

        expect(logout).toHaveBeenCalledTimes(1);
    });
});
