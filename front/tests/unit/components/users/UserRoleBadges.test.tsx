import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppRoles } from "@/constants/app-roles";
import { UserRoleBadges } from "@/components/users/UserRoleBadges";

describe("UserRoleBadges", () => {
    it("muestra roles", () => {
        render(<UserRoleBadges roles={[AppRoles.ADMIN, AppRoles.CLIENT]} />);
        expect(screen.getByText("Administrador")).toBeInTheDocument();
        expect(screen.getByText("Cliente")).toBeInTheDocument();
    });

    it("muestra Sin roles si no recibe roles", () => {
        render(<UserRoleBadges roles={[]} />);
        expect(screen.getByText("Sin roles")).toBeInTheDocument();
    });

    it("usa fallback neutral y muestra el valor si recibe un rol desconocido", () => {
        render(<UserRoleBadges roles={["UNKNOWN" as AppRoles]} />);

        expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
    });
});
