import { expect, test, type Locator, type Page, type Route } from "@playwright/test";

import {
    clearSession,
    expectCookieExists,
    expectCookieMissing,
    expectCookieValue,
    loginAs,
    loginResponse,
    testUsers,
    type TestUser,
} from "./helpers/auth";

async function expectInputInvalid(locator: Locator) {
    await expect
        .poll(async () =>
            locator.evaluate((input) => !(input as HTMLInputElement).validity.valid)
        )
        .toBe(true);
}

async function mockLoginSuccess(page: Page, user: TestUser, token = "test-jwt-token") {
    await page.route("**/auth/login", async (route: Route) => {
        const body = route.request().postDataJSON();

        expect(body).toEqual({
            email: user.email,
            password: "Password123*",
        });

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(loginResponse(user, token)),
        });
    });
}

async function mockLoginInvalid(page: Page) {
    await page.route("**/auth/login", async (route: Route) => {
        await route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({
                message: "Credenciales inválidas",
            }),
        });
    });
}

async function mockLogoutSuccess(page: Page) {
    await page.route("**/auth/logout", async (route: Route) => {
        const authorization = route.request().headers()["authorization"];

        expect(authorization).toMatch(/^Bearer .+/);

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                mensaje: "Sesión cerrada correctamente",
            }),
        });
    });
}

test.describe("Auth - login, sesión y JWT", () => {
    test.beforeEach(async ({ context }) => {
        await clearSession(context);
    });

    test("marca los campos como inválidos si intenta iniciar sesión vacío", async ({ page }) => {
        await page.goto("/login");

        await page.getByRole("button", { name: /iniciar sesión/i }).click();

        await expectInputInvalid(page.getByLabel("Correo electrónico"));
        await expectInputInvalid(page.getByLabel("Contraseña"));
    });

    test("muestra error si el backend rechaza las credenciales", async ({ page }) => {
        await mockLoginInvalid(page);

        await page.goto("/login");

        await page.getByLabel("Correo electrónico").fill("wrong@u.icesi.edu.co");
        await page.getByLabel("Contraseña").fill("bad-password");
        await page.getByRole("button", { name: /iniciar sesión/i }).click();

        await expect(page.getByText("Credenciales inválidas")).toBeVisible();
    });

    test("inicia sesión, guarda token, guarda usuario y redirige al dashboard", async ({ page, context }) => {
        await mockLoginSuccess(page, testUsers.ADMIN, "admin-real-jwt-token");

        await page.goto("/login");

        await page.getByLabel("Correo electrónico").fill(testUsers.ADMIN.email);
        await page.getByLabel("Contraseña").fill("Password123*");
        await page.getByRole("button", { name: /iniciar sesión/i }).click();

        await expect(page).toHaveURL(/\/dashboard$/);

        await expectCookieValue(context, "token", "admin-real-jwt-token");
        await expectCookieExists(context, "currentUser");
    });

    test("respeta el parámetro redirect después del login", async ({ page, context }) => {
        await mockLoginSuccess(page, testUsers.ADMIN, "admin-redirect-token");

        await page.goto("/login?redirect=/profile");

        await page.getByLabel("Correo electrónico").fill(testUsers.ADMIN.email);
        await page.getByLabel("Contraseña").fill("Password123*");
        await page.getByRole("button", { name: /iniciar sesión/i }).click();

        await expect(page).toHaveURL(/\/profile$/);
        await expectCookieValue(context, "token", "admin-redirect-token");
    });

    test("carga sesión desde cookies y muestra datos del usuario en el navbar", async ({ page, context, baseURL }) => {
        await loginAs(context, "ADMIN", baseURL!);

        await page.goto("/marketplace");

        await expect(page.getByText(testUsers.ADMIN.name)).toBeVisible();
        await expect(page.getByText(testUsers.ADMIN.email)).toBeVisible();
        await expect(page.getByRole("complementary").getByText("ADMIN", { exact: true })).toBeVisible();
    });

    test("logout llama al backend, elimina cookies y redirige al login", async ({ page, context, baseURL }) => {
        await loginAs(context, "ADMIN", baseURL!);
        await mockLogoutSuccess(page);

        await page.goto("/marketplace");

        await page.getByRole("button", { name: /cerrar sesión/i }).click();

        await expect(page).toHaveURL(/\/login(\?redirect=.*)?$/);
        await expectCookieMissing(context, "token");
        await expectCookieMissing(context, "currentUser");
    });
});

test.describe("Auth - forbidden", () => {
    test("muestra la página forbidden", async ({ page }) => {
        await page.goto("/forbidden");

        await expect(page.getByRole("heading", { name: "Acceso denegado" })).toBeVisible();
        await expect(page.getByText("No tienes permisos suficientes para acceder a esta página.")).toBeVisible();
        await expect(page.getByRole("link", { name: "Ir al dashboard" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Volver al inicio" })).toBeVisible();
    });
});

test.describe("Auth - menú por roles", () => {
    test.beforeEach(async ({ context }) => {
        await clearSession(context);
    });

    test("ADMIN ve panel, marketplace, servicios, órdenes, usuarios y perfil", async ({ page, context, baseURL }) => {
        await loginAs(context, "ADMIN", baseURL!);

        await page.goto("/marketplace");

        const nav = page.getByRole("navigation");

        await expect(nav.getByRole("link", { name: "Panel" })).toBeVisible();
        await expect(nav.getByRole("link", { name: "Marketplace" })).toBeVisible();
        await expect(nav.getByRole("link", { name: "Servicios" })).toBeVisible();
        await expect(nav.getByRole("link", { name: "Órdenes" })).toBeVisible();
        await expect(nav.getByRole("link", { name: "Usuarios" })).toBeVisible();
        await expect(nav.getByRole("link", { name: "Perfil" })).toBeVisible();
    });

    test("PROVIDER ve servicios pero no usuarios", async ({ page, context, baseURL }) => {
        await loginAs(context, "PROVIDER", baseURL!);

        await page.goto("/marketplace");

        const nav = page.getByRole("navigation");

        await expect(nav.getByRole("link", { name: "Panel" })).toBeVisible();
        await expect(nav.getByRole("link", { name: "Marketplace" })).toBeVisible();
        await expect(nav.getByRole("link", { name: "Servicios" })).toBeVisible();
        await expect(nav.getByRole("link", { name: "Órdenes" })).toBeVisible();
        await expect(nav.getByRole("link", { name: "Perfil" })).toBeVisible();

        await expect(nav.getByRole("link", { name: "Usuarios" })).toHaveCount(0);
    });

    test("CLIENT no ve servicios ni usuarios", async ({ page, context, baseURL }) => {
        await loginAs(context, "CLIENT", baseURL!);

        await page.goto("/marketplace");

        const nav = page.getByRole("navigation");

        await expect(nav.getByRole("link", { name: "Panel" })).toBeVisible();
        await expect(nav.getByRole("link", { name: "Marketplace" })).toBeVisible();
        await expect(nav.getByRole("link", { name: "Órdenes" })).toBeVisible();
        await expect(nav.getByRole("link", { name: "Perfil" })).toBeVisible();

        await expect(nav.getByRole("link", { name: "Servicios" })).toHaveCount(0);
        await expect(nav.getByRole("link", { name: "Usuarios" })).toHaveCount(0);
    });
});

test.describe("Auth - JWT en peticiones protegidas", () => {
    test.beforeEach(async ({ context }) => {
        await clearSession(context);
    });

    test("si una petición protegida responde 401, borra sesión y redirige al login", async ({ page, context, baseURL }) => {
        await loginAs(context, "ADMIN", baseURL!);

        await page.route("http://talentify-api.test/users", async (route: Route) => {
            await route.fulfill({
                status: 401,
                contentType: "application/json",
                body: JSON.stringify({
                    message: "Unauthorized",
                }),
            });
        });

        await page.goto("/users");

        await expect(page).toHaveURL(/\/login(\?redirect=.*)?$/);
        await expectCookieMissing(context, "token");
        await expectCookieMissing(context, "currentUser");
    });
});
