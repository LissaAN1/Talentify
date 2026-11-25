import { Code2 } from "lucide-react";
import { render, screen } from "@testing-library/react";

import { describe, expect, it } from "vitest";
import { CategoryCard } from "@/components/marketplace/CategoryCard";

describe("CategoryCard", () => {
    it("muestra título y descripción", () => {
        render(<CategoryCard title="Programación" description="Apps y APIs" icon={Code2} />);
        expect(screen.getByText("Programación")).toBeInTheDocument();
        expect(screen.getByText("Apps y APIs")).toBeInTheDocument();
    });
});
