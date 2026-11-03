import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Input } from "@/components/ui/Input";

describe("Input", () => {
    it("permite escribir texto", async () => {
        const user = userEvent.setup();
        render(<Input label="Nombre" />);
        await user.type(screen.getByLabelText("Nombre"), "Juan");
        expect(screen.getByLabelText("Nombre")).toHaveValue("Juan");
    });
    it("muestra mensaje de error", () => {
        render(<Input label="Correo" error="El correo es obligatorio." />);
        expect(screen.getByText("El correo es obligatorio.")).toBeInTheDocument();
    });
});
