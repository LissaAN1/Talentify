import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/shared/PageHeader";

describe("PageHeader", () => {
    it("muestra encabezado y acción", () => {
        render(<PageHeader eyebrow="Administración" title="Usuarios" description="Gestiona usuarios." action={<Button>Nuevo</Button>} />);
        expect(screen.getByText("Administración")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Usuarios" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Nuevo" })).toBeInTheDocument();
    });
});
