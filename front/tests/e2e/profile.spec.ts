import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

const qrCode =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lJ5h5QAAAABJRU5ErkJggg==";

test.describe("Profile - seguridad y 2FA", () => {
    test.beforeEach(async ({ context, baseURL }) => {
        await loginAs(context, "ADMIN", baseURL!);
    });

    test("profile muestra pantalla de seguridad 2FA", async ({ page }) => {
        await page.goto("/profile");

        await expect(page.getByRole("heading", { name: "Seguridad" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Autenticación de doble factor" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Generar código QR" })).toBeVisible();
    });

    test("genera QR de 2FA", async ({ page }) => {
        await page.route("**/auth/2fa/generar", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ qrCode }),
            });
        });

        await page.goto("/profile");

        await page.getByRole("button", { name: "Generar código QR" }).click();

        await expect(page.getByAltText("Código QR para activar 2FA")).toBeVisible();
    });

    test("muestra error si falla la generación del QR", async ({ page }) => {
        await page.route("**/auth/2fa/generar", async (route) => {
            await route.fulfill({
                status: 500,
                contentType: "application/json",
                body: JSON.stringify({
                    message: "No se pudo generar el código QR",
                }),
            });
        });

        await page.goto("/profile");

        await page.getByRole("button", { name: "Generar código QR" }).click();

        await expect(page.getByText("No se pudo generar el código QR")).toBeVisible();
    });

    test("deshabilita activar 2FA si el código no tiene 6 dígitos", async ({ page }) => {
        await page.route("**/auth/2fa/generar", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ qrCode }),
            });
        });

        await page.goto("/profile");

        await page.getByRole("button", { name: "Generar código QR" }).click();
        await page.getByLabel("Código de autenticación").fill("123");

        await expect(page.getByRole("button", { name: "Activar 2FA" })).toBeDisabled();
    });

    test("habilita 2FA con código válido", async ({ page }) => {
        await page.route("**/auth/2fa/generar", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ qrCode }),
            });
        });

        await page.route("**/auth/2fa/habilitar", async (route) => {
            const body = route.request().postDataJSON();

            expect(body).toEqual({ token: "123456" });

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    mensaje: "2FA habilitado correctamente",
                }),
            });
        });

        await page.goto("/profile");

        await page.getByRole("button", { name: "Generar código QR" }).click();
        await page.getByLabel("Código de autenticación").fill("123456");
        await page.getByRole("button", { name: "Activar 2FA" }).click();

        await expect(page.getByText("2FA habilitado correctamente")).toBeVisible();
    });

    test("muestra error si el backend rechaza el código 2FA", async ({ page }) => {
        await page.route("**/auth/2fa/generar", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ qrCode }),
            });
        });

         await page.route("**/auth/2fa/habilitar", async (route) => {
             await route.fulfill({
                 status: 400,
                 contentType: "application/json",
                 body: JSON.stringify({
                     message: "Código 2FA inválido",
                 }),
             });
        });

        await page.goto("/profile");

        await page.getByRole("button", { name: "Generar código QR" }).click();
        await page.getByLabel("Código de autenticación").fill("999999");
        await page.getByRole("button", { name: "Activar 2FA" }).click();

        await expect(page.getByText("Código 2FA inválido")).toBeVisible();
    });
});
