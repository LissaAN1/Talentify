import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AppRoles } from "@/constants/app-roles";
import { UserForm } from "@/components/users/UserForm";

const initialUser = {
    id: "user-1",
    name: "Usuario Demo",
    email: "demo@u.icesi.edu.co",
    roles: [AppRoles.CLIENT],
    isActive: true,
};

const initialUserWithMultipleRoles = {
    ...initialUser,
    roles: [AppRoles.CLIENT, AppRoles.PROVIDER],
};

describe("UserForm", () => {
    it("muestra errores mínimos en modo create vacío", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(
            <UserForm
                mode="create"
                submitLabel="Crear usuario"
                onSubmit={onSubmit}
            />
        );

        await user.click(screen.getByRole("button", { name: "Crear usuario" }));

        expect(screen.getByText("El nombre es obligatorio.")).toBeInTheDocument();
        expect(screen.getByText("El correo es obligatorio.")).toBeInTheDocument();
        expect(screen.getByText("La contraseña es obligatoria.")).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("envía payload correcto en modo create", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <UserForm
                mode="create"
                submitLabel="Crear usuario"
                onSubmit={onSubmit}
            />
        );

        await user.type(screen.getByLabelText(/nombre/i), "Nuevo Usuario");
        await user.type(screen.getByLabelText(/correo/i), "nuevo@u.icesi.edu.co");
        await user.type(screen.getByLabelText(/^contraseña/i), "Password123");

        await user.click(screen.getByRole("button", { name: "Crear usuario" }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
                name: "Nuevo Usuario",
                email: "nuevo@u.icesi.edu.co",
                password: "Password123",
                roles: [AppRoles.CLIENT],
            });
        });
    });

    it("agrega un rol adicional en modo create", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <UserForm
                mode="create"
                submitLabel="Crear usuario"
                onSubmit={onSubmit}
            />
        );

        await user.type(screen.getByLabelText(/nombre/i), "Nuevo Usuario");
        await user.type(screen.getByLabelText(/correo/i), "nuevo@u.icesi.edu.co");
        await user.type(screen.getByLabelText(/^contraseña/i), "Password123");

        await user.click(screen.getByRole("button", { name: "Proveedor" }));
        await user.click(screen.getByRole("button", { name: "Crear usuario" }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
                name: "Nuevo Usuario",
                email: "nuevo@u.icesi.edu.co",
                password: "Password123",
                roles: [AppRoles.CLIENT, AppRoles.PROVIDER],
            });
        });
    });

    it("no permite quitar el único rol asignado", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <UserForm
                mode="create"
                submitLabel="Crear usuario"
                onSubmit={onSubmit}
            />
        );

        await user.type(screen.getByLabelText(/nombre/i), "Nuevo Usuario");
        await user.type(screen.getByLabelText(/correo/i), "nuevo@u.icesi.edu.co");
        await user.type(screen.getByLabelText(/^contraseña/i), "Password123");

        await user.click(screen.getByRole("button", { name: "Cliente" }));
        await user.click(screen.getByRole("button", { name: "Crear usuario" }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
                name: "Nuevo Usuario",
                email: "nuevo@u.icesi.edu.co",
                password: "Password123",
                roles: [AppRoles.CLIENT],
            });
        });
    });

    it("en modo edit deshabilita correo", () => {
        render(
            <UserForm
                mode="edit"
                submitLabel="Guardar cambios"
                initialUser={initialUser}
                onSubmit={vi.fn()}
            />
        );

        expect(screen.getByLabelText(/correo/i)).toBeDisabled();
    });

    it("en modo edit envía name y roles cuando no hay nueva contraseña", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <UserForm
                mode="edit"
                submitLabel="Guardar cambios"
                initialUser={initialUser}
                onSubmit={onSubmit}
            />
        );

        await user.clear(screen.getByLabelText(/nombre/i));
        await user.type(screen.getByLabelText(/nombre/i), "Usuario Editado");

        await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
                name: "Usuario Editado",
                roles: [AppRoles.CLIENT],
            });
        });
    });

    it("en modo edit incluye password solo si se escribe", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <UserForm
                mode="edit"
                submitLabel="Guardar cambios"
                initialUser={initialUser}
                onSubmit={onSubmit}
            />
        );

        await user.type(screen.getByLabelText(/nueva contraseña/i), "Password456");
        await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
                name: "Usuario Demo",
                password: "Password456",
                roles: [AppRoles.CLIENT],
            });
        });
    });

    it("en modo edit permite quitar un rol si hay más de uno", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <UserForm
                mode="edit"
                submitLabel="Guardar cambios"
                initialUser={initialUserWithMultipleRoles}
                onSubmit={onSubmit}
            />
        );

        await user.click(screen.getByRole("button", { name: "Proveedor" }));
        await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
                name: "Usuario Demo",
                roles: [AppRoles.CLIENT],
            });
        });
    });

    it("en modo profile no muestra roles", () => {
        render(
            <UserForm
                mode="profile"
                submitLabel="Guardar cambios"
                initialUser={initialUser}
                onSubmit={vi.fn()}
            />
        );

        expect(screen.queryByText("Roles")).not.toBeInTheDocument();
    });

    it("en modo profile no envía roles en el payload", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <UserForm
                mode="profile"
                submitLabel="Guardar cambios"
                initialUser={initialUser}
                onSubmit={onSubmit}
            />
        );

        await user.clear(screen.getByLabelText(/nombre/i));
        await user.type(screen.getByLabelText(/nombre/i), "Perfil Editado");

        await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
                name: "Perfil Editado",
            });
        });
    });

    it("muestra mensaje de error si onSubmit rechaza con Error", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockRejectedValue(new Error("Correo ya registrado."));

        render(
            <UserForm
                mode="create"
                submitLabel="Crear usuario"
                onSubmit={onSubmit}
            />
        );

        await user.type(screen.getByLabelText(/nombre/i), "Nuevo Usuario");
        await user.type(screen.getByLabelText(/correo/i), "nuevo@u.icesi.edu.co");
        await user.type(screen.getByLabelText(/^contraseña/i), "Password123");

        await user.click(screen.getByRole("button", { name: "Crear usuario" }));

        await waitFor(() => {
            expect(screen.getByText("No se pudo guardar")).toBeInTheDocument();
            expect(screen.getByText("Correo ya registrado.")).toBeInTheDocument();
        });
    });

    it("muestra mensaje genérico si onSubmit rechaza con un error desconocido", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockRejectedValue("error desconocido");

        render(
            <UserForm
                mode="create"
                submitLabel="Crear usuario"
                onSubmit={onSubmit}
            />
        );

        await user.type(screen.getByLabelText(/nombre/i), "Nuevo Usuario");
        await user.type(screen.getByLabelText(/correo/i), "nuevo@u.icesi.edu.co");
        await user.type(screen.getByLabelText(/^contraseña/i), "Password123");

        await user.click(screen.getByRole("button", { name: "Crear usuario" }));

        await waitFor(() => {
            expect(screen.getByText("No se pudo guardar")).toBeInTheDocument();
            expect(
                screen.getByText("No se pudo guardar la información del usuario.")
            ).toBeInTheDocument();
        });
    });

    it("muestra estado de carga mientras guarda", async () => {
        const user = userEvent.setup();

        let resolveSubmit: () => void = () => {};

        const onSubmit = vi.fn(
            () =>
                new Promise<void>((resolve) => {
                    resolveSubmit = resolve;
                })
        );

        render(
            <UserForm
                mode="create"
                submitLabel="Crear usuario"
                onSubmit={onSubmit}
            />
        );

        await user.type(screen.getByLabelText(/nombre/i), "Nuevo Usuario");
        await user.type(screen.getByLabelText(/correo/i), "nuevo@u.icesi.edu.co");
        await user.type(screen.getByLabelText(/^contraseña/i), "Password123");

        await user.click(screen.getByRole("button", { name: "Crear usuario" }));

        expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();

        resolveSubmit();

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Crear usuario" })).toBeEnabled();
        });
    });

    it("usa onCancelHref personalizado en el botón cancelar", () => {
        render(
            <UserForm
                mode="create"
                submitLabel="Crear usuario"
                onSubmit={vi.fn()}
                onCancelHref="/dashboard"
            />
        );

        expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute(
            "href",
            "/dashboard"
        );
    });
});

