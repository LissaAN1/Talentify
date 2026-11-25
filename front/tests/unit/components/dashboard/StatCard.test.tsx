import { Users } from "lucide-react";
import { render, screen } from "@testing-library/react";

import { describe, expect, it } from "vitest";
import { StatCard } from "@/components/dashboard/StatCard";

describe("StatCard", () => {
    it("muestra título y valor", () => {
        render(<StatCard title="Usuarios" value="38" icon={Users} tone="blue" />);
        expect(screen.getByText("Usuarios")).toBeInTheDocument();
        expect(screen.getByText("38")).toBeInTheDocument();
    });
});
