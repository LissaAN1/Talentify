import { render, screen } from "@testing-library/react";

import { describe, expect, it } from "vitest";
import { ServiceCard } from "@/components/marketplace/ServiceCard";
import { AppRoles } from "@/constants/app-roles";
import { Service, ServiceCategory, ServiceStatus } from "@/interfaces/service";

const service: Service = {
    id: "service-1",
    title: "Diseño de logo",
    description: "Creación de identidad visual básica.",
    category: ServiceCategory.DESIGN,
    price: 50000,
    status: ServiceStatus.ACTIVE,
    isActive: true,
    provider: {
        id: "provider-1",
        name: "Proveedor Talentify",
        email: "provider@u.icesi.edu.co",
        roles: [AppRoles.PROVIDER],
    },
};

describe("ServiceCard", () => {
    it("muestra información del servicio", () => {
        render(<ServiceCard service={service} />);
        expect(screen.getByText("Diseño de logo")).toBeInTheDocument();
        expect(screen.getByText("DESIGN")).toBeInTheDocument();
        expect(screen.getByText("Proveedor Talentify")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Ver detalle" })).toHaveAttribute("href", "/services/service-1");
    });

    it("muestra proveedor por defecto si el servicio no trae provider", () => {
        const serviceWithoutProvider: Service = {
            id: "service-2",
            title: "Landing page",
            description: "Desarrollo de landing page.",
            category: ServiceCategory.PROGRAMMING,
            price: 120000,
            status: ServiceStatus.ACTIVE,
            isActive: true,
        };

        render(<ServiceCard service={serviceWithoutProvider} />);

        expect(screen.getByText("Landing page")).toBeInTheDocument();
        expect(screen.getByText("Proveedor Talentify")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Ver detalle" })).toHaveAttribute(
            "href",
            "/services/service-2"
        );
    });
});
