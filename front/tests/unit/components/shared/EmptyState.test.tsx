import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/shared/EmptyState";

describe("EmptyState", () => {
    it("muestra título, descripción y acción", () => {
        render(<EmptyState title="No hay datos" description="Todavía no existen registros." action={<Button>Crear</Button>} />);
        expect(screen.getByText("No hay datos")).toBeInTheDocument();
        expect(screen.getByText("Todavía no existen registros.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Crear" })).toBeInTheDocument();
    });
});
