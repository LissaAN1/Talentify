import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";

import { ConfirmDialog } from "@/components/services/ConfirmDialog";

describe("ConfirmDialog", () => {
    afterEach(() => {
        document.body.style.overflow = "";
    });

    it("no renderiza nada si open es false", () => {
        const { container } = render(
            <ConfirmDialog
                open={false}
                title="Eliminar servicio"
                onConfirm={vi.fn()}
            />
        );

        expect(container).toBeEmptyDOMElement();
    });

    it("muestra título, descripción y botones cuando está abierto", () => {
        render(
            <ConfirmDialog
                open
                title="Desactivar servicio"
                description="Esta acción desactivará el servicio."
                confirmText="Sí, desactivar"
                cancelText="Volver"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Desactivar servicio")).toBeInTheDocument();
        expect(screen.getByText("Esta acción desactivará el servicio.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Sí, desactivar" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Volver" })).toBeInTheDocument();
    });

    it("ejecuta onConfirm al hacer clic en confirmar", () => {
        const onConfirm = vi.fn();

        render(
            <ConfirmDialog
                open
                title="Confirmar"
                onConfirm={onConfirm}
                onCancel={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("ejecuta onCancel al hacer clic en cancelar", () => {
        const onCancel = vi.fn();

        render(
            <ConfirmDialog
                open
                title="Confirmar"
                onConfirm={vi.fn()}
                onCancel={onCancel}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("ejecuta onCancel al hacer clic en el fondo", () => {
        const onCancel = vi.fn();

        render(
            <ConfirmDialog
                open
                title="Confirmar"
                onConfirm={vi.fn()}
                onCancel={onCancel}
            />
        );

        fireEvent.click(screen.getByRole("presentation"));

        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("no cierra al hacer clic dentro del panel", () => {
        const onCancel = vi.fn();

        render(
            <ConfirmDialog
                open
                title="Confirmar"
                onConfirm={vi.fn()}
                onCancel={onCancel}
            />
        );

        fireEvent.click(screen.getByRole("dialog"));

        expect(onCancel).not.toHaveBeenCalled();
    });

    it("bloquea el scroll del body mientras está abierto", () => {
        render(
            <ConfirmDialog
                open
                title="Confirmar"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        expect(document.body.style.overflow).toBe("hidden");
    });

    it("muestra estado de carga en el botón de confirmación", () => {
        render(
            <ConfirmDialog
                open
                title="Confirmar"
                confirmText="Sí"
                isLoading
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        expect(screen.getByRole("button", { name: "Procesando..." })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    });
});
