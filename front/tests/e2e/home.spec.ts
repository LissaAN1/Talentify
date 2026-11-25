import { expect, test } from "@playwright/test";

test.describe("Landing page pública", () => {
    test("muestra el título, la búsqueda y las categorías", async ({ page }) => {
        await page.goto("/");

        await expect(page.getByRole("heading", { name: /encuentra talento estudiantil/i })).toBeVisible();
        await expect(page.getByPlaceholder(/qué servicio buscas/i)).toBeVisible();
        await expect(page.getByText("Categorías principales")).toBeVisible();

        for (const categoria of ["Programación", "Diseño", "Marketing", "Video"]) {
            await expect(page.getByText(categoria, { exact: true }).first()).toBeVisible();
        }
    });

    test("el acceso Iniciar sesión lleva al login", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("link", { name: "Iniciar sesión" }).first().click();

        await expect(page).toHaveURL(/\/login/);
    });

    test("el acceso Crear cuenta lleva al registro", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("link", { name: "Crear cuenta" }).click();

        await expect(page).toHaveURL(/\/register/);
    });

    test("una ruta inexistente muestra la página 404 con enlace al inicio", async ({ page }) => {
        await page.goto("/esta-ruta-no-existe");

        await expect(page.getByRole("heading", { name: "Página no disponible" })).toBeVisible();
        await page.getByRole("link", { name: "Volver al inicio" }).click();

        await expect(page).toHaveURL(/\/$/);
    });
});
