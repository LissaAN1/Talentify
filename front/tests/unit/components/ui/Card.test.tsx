import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "@/components/ui/Card";

describe("Card", () => {
    it("renderiza contenido", () => {
        render(<Card>Contenido</Card>);
        expect(screen.getByText("Contenido")).toBeInTheDocument();
    });
});
