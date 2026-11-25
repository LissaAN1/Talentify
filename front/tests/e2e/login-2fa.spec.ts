import { expect, test, type Page, type Route } from "@playwright/test";

import { expectCookieValue, loginResponse, testUsers } from "./helpers/auth";

async function mockLoginRequires2FA(page: Page) {
    await page.route("**/auth/login", async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ requires2FA: true, partialToken: "partial-token-123" }),
        });
    });
}

async function startLogin(page: Page) {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(testUsers.ADMIN.email);
    await page.getByLabel("Contraseña").fill("Password123*");
    await page.getByRole("button", { name: /iniciar sesión/i }).click();
}

test.describe("Login con 2FA", () => {
    test("pide el código de 6 dígitos y completa el login con un código válido", async ({ page, context }) => {
        await mockLoginRequires2FA(page);
        await page.route("**/auth/2fa/verificar", async (route: Route) => {
            expect(route.request().headers()["authorization"]).toBe("Bearer partial-token-123");
            expect(route.request().postDataJSON()).toEqual({ token: "123456" });
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(loginResponse(testUsers.ADMIN, "admin-2fa-jwt-token")),
            });
        });

        await startLogin(page);

        await expect(page.getByRole("heading", { name: "Autenticación de dos factores" })).toBeVisible();
        await page.getByLabel("Código 2FA").fill("123456");
        await page.getByRole("button", { name: "Verificar" }).click();

        await expect(page).toHaveURL(/\/dashboard$/);
        await expectCookieValue(context, "token", "admin-2fa-jwt-token");
    });

    test("muestra error si el código 2FA es incorrecto y no inicia sesión", async ({ page }) => {
        await mockLoginRequires2FA(page);
        await page.route("**/auth/2fa/verificar", async (route: Route) => {
            await route.fulfill({
                status: 401,
                contentType: "application/json",
                body: JSON.stringify({ message: "Código 2FA inválido" }),
            });
        });

        await startLogin(page);
        await page.getByLabel("Código 2FA").fill("000000");
        await page.getByRole("button", { name: "Verificar" }).click();

        await expect(page.getByText("Código 2FA inválido")).toBeVisible();
        await expect(page).toHaveURL(/\/login/);
    });

    test("exige 6 dígitos antes de verificar", async ({ page }) => {
        await mockLoginRequires2FA(page);
        await startLogin(page);

        await page.getByLabel("Código 2FA").fill("123");
        await page.getByRole("button", { name: "Verificar" }).click();

        await expect(page.getByText("Por favor ingresa el código de 6 dígitos")).toBeVisible();
    });

    test("permite volver al inicio de sesión", async ({ page }) => {
        await mockLoginRequires2FA(page);
        await startLogin(page);

        await page.getByRole("button", { name: "Volver al inicio de sesión" }).click();
        await expect(page.getByRole("button", { name: /iniciar sesión/i })).toBeVisible();
    });
});
