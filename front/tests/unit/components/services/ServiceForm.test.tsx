import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ServiceForm } from "@/components/services/ServiceForm";
import { ServiceCategory, ServiceStatus } from "@/interfaces/service";

const initialService = {
    id: "service-1",
    title: "Diseño de logo profesional",
    description: "Diseño de identidad visual para emprendimientos.",
    category: ServiceCategory.DESIGN,
    price: 80000,
    status: ServiceStatus.ACTIVE,
    isActive: true,
    createdAt: "2026-05-31T10:00:00.000Z",
    updatedAt: "2026-05-31T10:00:00.000Z",
    provider: {
        id: "provider-1",
        name: "Proveedor Talentify",
        email: "provider@u.icesi.edu.co",
        roles: [],
    },
};

describe("ServiceForm", () => {
    it("muestra validaciones si se envía vacío", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(<ServiceForm onSubmit={onSubmit} submitText="Crear servicio" />);

        await user.click(screen.getByRole("button", { name: "Crear servicio" }));

        expect(await screen.findByText("El título es obligatorio.")).toBeInTheDocument();
        expect(screen.getByText("La descripción es obligatoria.")).toBeInTheDocument();
        expect(screen.getByText("La categoría es obligatoria.")).toBeInTheDocument();
        expect(screen.getByText("El precio es obligatorio.")).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("envía payload correcto al crear servicio", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(<ServiceForm onSubmit={onSubmit} submitText="Crear servicio" />);

        await user.type(screen.getByLabelText(/título/i), "Landing page moderna");
        await user.type(
            screen.getByLabelText(/descripción/i),
            "Desarrollo de landing page moderna para emprendimientos."
        );
        await user.selectOptions(screen.getByLabelText(/categoría/i), ServiceCategory.PROGRAMMING);
        await user.type(screen.getByLabelText(/precio/i), "120000");

        await user.click(screen.getByRole("button", { name: "Crear servicio" }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
                title: "Landing page moderna",
                description: "Desarrollo de landing page moderna para emprendimientos.",
                category: ServiceCategory.PROGRAMMING,
                price: 120000,
            });
        });
    });

    it("carga valores iniciales en modo edición", () => {
        render(
            <ServiceForm
                initialValues={initialService}
                onSubmit={vi.fn()}
                submitText="Guardar cambios"
            />
        );

        expect(screen.getByDisplayValue("Diseño de logo profesional")).toBeInTheDocument();
        expect(
            screen.getByDisplayValue("Diseño de identidad visual para emprendimientos.")
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue("80000")).toBeInTheDocument();
    });

    it("muestra error recibido por props", () => {
        render(
            <ServiceForm
                onSubmit={vi.fn()}
                error="No fue posible crear el servicio."
            />
        );

        expect(screen.getByText("No fue posible guardar el servicio")).toBeInTheDocument();
        expect(screen.getByText("No fue posible crear el servicio.")).toBeInTheDocument();
    });

    it("muestra botón cancelar si recibe cancelHref", () => {
        render(
            <ServiceForm
                onSubmit={vi.fn()}
                cancelHref="/services"
            />
        );

        expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute(
            "href",
            "/services"
        );
    });

    it("deshabilita submit si isLoading es true", () => {
        render(
            <ServiceForm
                onSubmit={vi.fn()}
                isLoading
                submitText="Guardar"
            />
        );

        expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
    });
});
