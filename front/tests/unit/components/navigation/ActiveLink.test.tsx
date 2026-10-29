import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { User } from "lucide-react";

import { ActiveLink } from "@/components/navigation/ActiveLink";

const usePathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
    usePathname: () => usePathnameMock(),
}));

describe("ActiveLink", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renderiza un link con href y label", () => {
        usePathnameMock.mockReturnValue("/dashboard");

        render(<ActiveLink href="/dashboard" label="Dashboard" />);

        const link = screen.getByRole("link", { name: "Dashboard" });

        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/dashboard");
    });

    it("aplica estilos activos cuando la ruta actual coincide exactamente", () => {
        usePathnameMock.mockReturnValue("/dashboard");

        render(<ActiveLink href="/dashboard" label="Dashboard" exact />);

        const link = screen.getByRole("link", { name: "Dashboard" });

        expect(link).toHaveClass("bg-green-50");
        expect(link).toHaveClass("text-green-700");
    });

    it("no aplica estilos activos cuando exact=true y la ruta es hija", () => {
        usePathnameMock.mockReturnValue("/dashboard/stats");

        render(<ActiveLink href="/dashboard" label="Dashboard" exact />);

        const link = screen.getByRole("link", { name: "Dashboard" });

        expect(link).not.toHaveClass("bg-green-50");
        expect(link).toHaveClass("text-slate-600");
    });

    it("aplica estilos activos para rutas hijas cuando exact=false", () => {
        usePathnameMock.mockReturnValue("/users/user-1/edit");

        render(<ActiveLink href="/users" label="Usuarios" />);

        const link = screen.getByRole("link", { name: "Usuarios" });

        expect(link).toHaveClass("bg-green-50");
        expect(link).toHaveClass("text-green-700");
    });

    it("renderiza ícono si se pasa la prop icon", () => {
        usePathnameMock.mockReturnValue("/users");

        render(<ActiveLink href="/users" label="Usuarios" icon={User} />);

        const link = screen.getByRole("link", { name: "Usuarios" });

        expect(link.querySelector("svg")).toBeInTheDocument();
    });
});
