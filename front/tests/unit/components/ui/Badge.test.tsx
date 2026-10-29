import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/Badge";

describe("Badge", () => {
    it("renderiza el contenido recibido", () => {
        render(<Badge variant="success">Activo</Badge>);
        expect(screen.getByText("Activo")).toBeInTheDocument();
    });
});
