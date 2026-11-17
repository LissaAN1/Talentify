import { expect, test } from "@playwright/test";

import { loginAs } from "./helpers/auth";
import { mockUsersApi } from "./helpers/users-mock";

test.describe("Usuarios", () => {
    test.beforeEach(async ({ page, context, baseURL }) => {
        await loginAs(context, "ADMIN", baseURL!);
        await mockUsersApi(page);
    });

    test("lista usuarios y permite buscar", async ({ page }) => {
        await page.goto("/users");

        await expect(page.getByRole("heading", { name: "Usuarios" })).toBeVisible();
        await expect(page.getByText("Admin Talentify")).toBeVisible();

        await page.getByPlaceholder("Buscar por nombre, correo o rol...").fill("cliente");

        await expect(page.getByText("Cliente Demo")).toBeVisible();
        await expect(page.getByText("Admin Talentify")).not.toBeVisible();
    });

    test("muestra alerta si falla la carga del listado", async ({ page }) => {
        await mockUsersApi(page, {
            listError: true,
        });

        await page.goto("/users");

        await expect(page.getByText("No se pudieron cargar los usuarios")).toBeVisible();
        await expect(page.getByText("No fue posible obtener la información en este momento.")).toBeVisible();
    });

    test("muestra estado vacío cuando no hay usuarios", async ({ page }) => {
        await mockUsersApi(page, {
            users: [],
        });

        await page.goto("/users");

        await expect(page.getByText("No hay usuarios disponibles")).toBeVisible();
        await expect(page.getByRole("link", { name: "Crear usuario" })).toBeVisible();
    });

    test("crea usuario con datos mínimos", async ({ page }) => {
        await page.goto("/users/new");

        await page.getByLabel("Nombre").fill("Nuevo Usuario");
        await page.getByLabel("Correo").fill("nuevo@u.icesi.edu.co");
        await page.getByLabel("Contraseña").fill("Password123");
        await page.getByRole("button", { name: "Crear usuario" }).click();

        await expect(page).toHaveURL(/\/users$/);
    });

    test("muestra validaciones al crear usuario vacío", async ({ page }) => {
        await page.goto("/users/new");

        await page.getByRole("button", { name: "Crear usuario" }).click();

        await expect(page.getByText("El nombre es obligatorio.")).toBeVisible();
        await expect(page.getByText("El correo es obligatorio.")).toBeVisible();
        await expect(page.getByText("La contraseña es obligatoria.")).toBeVisible();
    });

    test("muestra error si falla la creación del usuario", async ({ page }) => {
        await mockUsersApi(page, {
            createError: true,
        });

        await page.goto("/users/new");

        await page.getByLabel("Nombre").fill("Nuevo Usuario");
        await page.getByLabel("Correo").fill("nuevo@u.icesi.edu.co");
        await page.getByLabel("Contraseña").fill("Password123");
        await page.getByRole("button", { name: "Crear usuario" }).click();

        await expect(page.getByText("No se pudo guardar")).toBeVisible();
    });

    test("consulta detalle de usuario", async ({ page }) => {
        await page.goto("/users/user-1");

        await expect(page.getByRole("heading", { name: "Admin Talentify" })).toBeVisible();
        await expect(page.getByRole("main").getByText("admin@u.icesi.edu.co")).toBeVisible();
        await expect(page.getByText("Administrador")).toBeVisible();
        await expect(page.getByText("Activo")).toBeVisible();
    });

    test("muestra error si el usuario no existe", async ({ page }) => {
        await mockUsersApi(page, {
            detailError: true,
        });

        await page.goto("/users/user-1");

        await expect(page.getByText("Usuario no disponible")).toBeVisible();
        await expect(page.getByText("No fue posible cargar la información del usuario.")).toBeVisible();
    });

    test("edita usuario", async ({ page }) => {
        await page.goto("/users/user-1/edit");

        await page.getByLabel("Nombre").fill("Admin Editado");
        await page.getByRole("button", { name: "Guardar cambios" }).click();

        await expect(page).toHaveURL(/\/users\/user-1$/);
    });

    test("muestra error si falla la actualización del usuario", async ({ page }) => {
        await mockUsersApi(page, {
            updateError: true,
        });

        await page.goto("/users/user-1/edit");

        await page.getByLabel("Nombre").fill("Admin Editado");
        await page.getByRole("button", { name: "Guardar cambios" }).click();

        await expect(page.getByText("No se pudo guardar")).toBeVisible();
    });

    test("muestra error si no puede cargar el usuario para editar", async ({ page }) => {
        await mockUsersApi(page, {
            detailError: true,
        });

        await page.goto("/users/user-1/edit");

        await expect(page.getByText("Usuario no disponible")).toBeVisible();
        await expect(page.getByText("No fue posible cargar la información del usuario.")).toBeVisible();
    });

    test("desactiva usuario cuando confirma la acción", async ({ page }) => {
        const api = await mockUsersApi(page);

        await page.goto("/users/user-1");

        page.once("dialog", async (dialog) => {
            expect(dialog.message()).toContain("desactivar");
            await dialog.accept();
        });

        await page.getByRole("button", { name: "Desactivar" }).click();

        await expect(page).toHaveURL(/\/users$/);
        expect(api.requests.deletedUsers).toEqual(["user-1"]);
    });

    test("no desactiva usuario si cancela la confirmación", async ({ page }) => {
        const api = await mockUsersApi(page);

        await page.goto("/users/user-1");

        page.once("dialog", async (dialog) => {
            await dialog.dismiss();
        });

        await page.getByRole("button", { name: "Desactivar" }).click();

        await expect(page).toHaveURL(/\/users\/user-1$/);
        expect(api.requests.deletedUsers).toHaveLength(0);
    });

    test("muestra error si falla la desactivación del usuario", async ({ page }) => {
        await mockUsersApi(page, {
            deleteError: true,
        });

        await page.goto("/users/user-1");

        page.once("dialog", async (dialog) => {
            await dialog.accept();
        });

        await page.getByRole("button", { name: "Desactivar" }).click();

        await expect(page.getByText("No se pudo completar la acción")).toBeVisible();
        await expect(page.getByText("No fue posible desactivar el usuario.")).toBeVisible();
    });
});
