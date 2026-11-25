import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { mockServicesApi, activeServiceProgramming } from "./helpers/services-mock";

test.describe("Marketplace", () => {
    test.beforeEach(async ({ context, baseURL }) => {
        await loginAs(context, "CLIENT", baseURL!);
    });

    test("marketplace muestra y filtra servicios por búsqueda", async ({ page }) => {
        await mockServicesApi(page);
        await page.goto("/marketplace");

        await expect(page.getByText("Desarrollo de landing page")).toBeVisible();
        await expect(page.getByText("Diseño de logo")).toBeVisible();

        await page.getByPlaceholder("Buscar por título o descripción...").fill("logo");

        await expect(page.getByText("Diseño de logo")).toBeVisible();
        await expect(page.getByText("Desarrollo de landing page")).not.toBeVisible();
    });

    test("marketplace filtra por categoría", async ({ page }) => {
        await mockServicesApi(page);
        await page.goto("/marketplace");

        await page.getByRole("button", { name: "Diseño" }).click();

        await expect(page.getByText("Diseño de logo")).toBeVisible();
        await expect(page.getByText("Desarrollo de landing page")).not.toBeVisible();
        await expect(page.getByText("Edición de reels")).not.toBeVisible();
    });

    test("marketplace muestra estado vacío y permite limpiar filtros", async ({ page }) => {
        await mockServicesApi(page);
        await page.goto("/marketplace");

        await page.getByPlaceholder("Buscar por título o descripción...").fill("servicio inexistente");

        await expect(page.getByText("No encontramos servicios")).toBeVisible();

        await page.getByRole("button", { name: "Limpiar filtros" }).click();

        await expect(page.getByText("Desarrollo de landing page")).toBeVisible();
        await expect(page.getByText("Diseño de logo")).toBeVisible();
    });

    test("cada tarjeta expone el enlace correcto al detalle del servicio", async ({ page }) => {
        await mockServicesApi(page, {
            activeServices: [activeServiceProgramming],
            singleService: activeServiceProgramming,
        });

        await page.goto("/marketplace");

        const serviceCard = page.locator("article", {
            hasText: activeServiceProgramming.title,
        });

        const detailLink = serviceCard.getByRole("link", { name: "Ver detalle" });
        const expectedHref = `/services/${activeServiceProgramming.id}`;

        await expect(detailLink).toBeVisible();
        await expect(detailLink).toHaveAttribute("href", expectedHref);
    });

    test("marketplace muestra alerta de error si falla la carga", async ({ page }) => {
        await mockServicesApi(page, { listError: true });
        await page.goto("/marketplace");

        await expect(page.getByText("No fue posible cargar el marketplace")).toBeVisible();
    });

    test("marketplace muestra estado vacío cuando no hay servicios activos", async ({ page }) => {
        await mockServicesApi(page, { activeServices: [] });
        await page.goto("/marketplace");

        await expect(page.getByText("No encontramos servicios")).toBeVisible();
    });
});
