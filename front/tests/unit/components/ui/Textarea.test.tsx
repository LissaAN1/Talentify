import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Textarea } from "@/components/ui/Textarea";

describe("Textarea", () => {
    it("permite escribir texto largo", async () => {
        const user = userEvent.setup();
        render(<Textarea label="Descripción" />);
        await user.type(screen.getByLabelText("Descripción"), "Texto de prueba");
        expect(screen.getByLabelText("Descripción")).toHaveValue("Texto de prueba");
    });

    it("muestra helperText cuando no hay error", () => {
        render(
            <Textarea
                label="Descripción"
                helperText="Escribe una descripción clara."
            />
        );

        expect(screen.getByText("Escribe una descripción clara.")).toBeInTheDocument();
        expect(screen.getByText("Escribe una descripción clara.")).toHaveClass("text-slate-500");
    });

    it("muestra error, aplica borde rojo y prioriza error sobre helperText", () => {
        render(
            <Textarea
                label="Descripción"
                error="La descripción es obligatoria."
                helperText="Escribe una descripción clara."
                className="custom-textarea"
            />
        );

        const textarea = screen.getByLabelText(/descripción/i);

        expect(screen.getByText("La descripción es obligatoria.")).toBeInTheDocument();
        expect(screen.queryByText("Escribe una descripción clara.")).not.toBeInTheDocument();
        expect(screen.getByText("La descripción es obligatoria.")).toHaveClass("text-red-600");
        expect(textarea).toHaveClass("border-red-300");
        expect(textarea).toHaveClass("custom-textarea");
    });

    it("usa id explícito si se recibe por props", () => {
        render(<Textarea id="description-field" label="Descripción" />);

        expect(screen.getByLabelText(/descripción/i)).toHaveAttribute(
            "id",
            "description-field"
        );
    });

    it("usa name como id si no recibe id ni label", () => {
        render(<Textarea name="notes" />);

        const textarea = screen.getByRole("textbox");

        expect(textarea).toHaveAttribute("id", "notes");
        expect(textarea).toHaveAttribute("name", "notes");
    });
});
