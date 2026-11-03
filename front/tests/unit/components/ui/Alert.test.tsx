import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert } from "@/components/ui/Alert";

describe("Alert", () => {
    it("muestra título y mensaje", () => {
        render(<Alert variant="warning" title="Advertencia" message="Revisa los datos." />);
        expect(screen.getByText("Advertencia")).toBeInTheDocument();
        expect(screen.getByText("Revisa los datos.")).toBeInTheDocument();
    });
});
