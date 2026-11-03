import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
    it("renderiza como botón cuando no recibe href", async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Guardar</Button>);
        await user.click(screen.getByRole("button", { name: "Guardar" }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
    it("renderiza como enlace cuando recibe href", () => {
        render(<Button href="/dashboard">Ir al panel</Button>);
        expect(screen.getByRole("link", { name: "Ir al panel" })).toHaveAttribute("href", "/dashboard");
    });
});
