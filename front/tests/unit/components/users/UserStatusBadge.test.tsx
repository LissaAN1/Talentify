import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserStatusBadge } from "@/components/users/UserStatusBadge";

describe("UserStatusBadge", () => {
    it("muestra Activo", () => {
        render(<UserStatusBadge isActive />);
        expect(screen.getByText("Activo")).toBeInTheDocument();
    });
    it("muestra Inactivo", () => {
        render(<UserStatusBadge isActive={false} />);
        expect(screen.getByText("Inactivo")).toBeInTheDocument();
    });
});
