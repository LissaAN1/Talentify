import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Select } from "@/components/ui/Select";

describe("Select", () => {
    it("muestra opciones y permite seleccionar", async () => {
        const user = userEvent.setup();
        render(<Select label="Rol" options={[{ value: "ADMIN", label: "Administrador" }, { value: "CLIENT", label: "Cliente" }]} />);
        const select = screen.getByLabelText("Rol");
        await user.selectOptions(select, "CLIENT");
        expect(select).toHaveValue("CLIENT");
    });

    it("muestra helperText cuando no hay error", () => {
        render(
            <Select
                label="Categoría"
                helperText="Selecciona una categoría."
                options={[
                    { value: "DESIGN", label: "Diseño" },
                    { value: "PROGRAMMING", label: "Programación" },
                ]}
            />
        );

        expect(screen.getByText("Selecciona una categoría.")).toBeInTheDocument();
        expect(screen.getByText("Selecciona una categoría.")).toHaveClass("text-slate-500");
    });

    it("muestra error, aplica borde rojo y prioriza error sobre helperText", () => {
        render(
            <Select
                label="Rol"
                error="El rol es obligatorio."
                helperText="Selecciona un rol."
                className="custom-select"
                options={[
                    { value: "ADMIN", label: "Administrador" },
                    { value: "CLIENT", label: "Cliente" },
                ]}
            />
        );

        const select = screen.getByLabelText(/rol/i);

        expect(screen.getByText("El rol es obligatorio.")).toBeInTheDocument();
        expect(screen.queryByText("Selecciona un rol.")).not.toBeInTheDocument();
        expect(screen.getByText("El rol es obligatorio.")).toHaveClass("text-red-600");
        expect(select).toHaveClass("border-red-300");
        expect(select).toHaveClass("custom-select");
    });

    it("usa id explícito si se recibe por props", () => {
        render(
            <Select
                id="role-select"
                label="Rol"
                options={[
                    { value: "ADMIN", label: "Administrador" },
                    { value: "CLIENT", label: "Cliente" },
                ]}
            />
        );

        expect(screen.getByLabelText(/rol/i)).toHaveAttribute("id", "role-select");
    });

    it("usa name como id si no recibe id ni label", () => {
        render(
            <Select
                name="category"
                options={[
                    { value: "DESIGN", label: "Diseño" },
                    { value: "PROGRAMMING", label: "Programación" },
                ]}
            />
        );

        const select = screen.getByRole("combobox");

        expect(select).toHaveAttribute("id", "category");
        expect(select).toHaveAttribute("name", "category");
    });
});
