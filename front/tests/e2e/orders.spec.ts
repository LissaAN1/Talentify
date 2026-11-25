import { expect, test, type Page } from "@playwright/test";

import { loginAs } from "./helpers/auth";
import {
    mockOrdersApi,
    mockService,
} from "./helpers/orders-mock";

const serviceSelect = (page: Page) => page.locator('select[name="serviceId"]');
const selectedServiceInput = (page: Page) => page.locator('input[name="serviceName"]');
const amountInput = (page: Page) => page.locator('input[name="totalAmount"]');

test.describe("Orders", () => {
    test.beforeEach(async ({ context, baseURL }) => {
        await loginAs(context, "CLIENT", baseURL!);
    });

    test("muestra el formulario de nueva orden", async ({ page }) => {
        await mockOrdersApi(page);

        await page.goto("/orders/new");

        await expect(page.getByRole("heading", { name: "Nueva orden" })).toBeVisible();
        await expect(serviceSelect(page)).toBeVisible();
        await expect(amountInput(page)).toBeVisible();
        await expect(page.getByLabel("Notas (opcional)")).toBeVisible();
        await expect(page.getByRole("button", { name: "Crear orden" })).toBeVisible();
    });

    test("muestra validación si no se selecciona servicio", async ({ page }) => {
        await mockOrdersApi(page);

        await page.goto("/orders/new");

        await page.getByRole("button", { name: "Crear orden" }).click();

        await expect(page.getByText("Debes seleccionar un servicio.")).toBeVisible();
    });

    test("al seleccionar un servicio, completa el monto automáticamente y no permite editarlo", async ({ page }) => {
        await mockOrdersApi(page);

        await page.goto("/orders/new");

        await serviceSelect(page).selectOption(mockService.id);

        await expect(amountInput(page)).toHaveValue(String(mockService.price));
        await expect(amountInput(page)).toHaveAttribute("readonly", "");
    });

    test("precarga servicio desde query params y crea una orden", async ({ page }) => {
        const api = await mockOrdersApi(page);

        await page.goto(`/orders/new?serviceId=${mockService.id}`);

        await expect(page.getByText("Diseño de logo profesional")).toBeVisible();
        await expect(page.getByText("Proveedor Talentify")).toBeVisible();

        await expect(page.getByText("Servicio seleccionado automáticamente")).toBeVisible();
        await expect(selectedServiceInput(page)).toHaveValue(mockService.title);
        await expect(amountInput(page)).toHaveValue(String(mockService.price));
        await expect(amountInput(page)).toHaveAttribute("readonly", "");

        await page.getByLabel("Notas (opcional)").fill("Necesito una versión para redes sociales.");

        page.once("dialog", async (dialog) => {
            expect(dialog.message()).toContain("¿Confirmas crear una orden");
            await dialog.accept();
        });

        await page.getByRole("button", { name: "Crear orden" }).click();

        await expect(page).toHaveURL(/\/orders\/55555555-5555-4555-8555-555555555555$/);
        // El contenido del detalle se verifica en HU-17, cuando se agrega la página /orders/[id].

        expect(api.requests.createdOrders).toHaveLength(1);
        expect(api.requests.createdOrders[0]).toEqual({
            serviceId: mockService.id,
            totalAmount: mockService.price,
            notes: "Necesito una versión para redes sociales.",
        });
    });

    test("no crea la orden si el usuario cancela la confirmación", async ({ page }) => {
        const api = await mockOrdersApi(page);

        await page.goto(`/orders/new?serviceId=${mockService.id}`);

        page.once("dialog", async (dialog) => {
            await dialog.dismiss();
        });

        await page.getByRole("button", { name: "Crear orden" }).click();

        await expect(page).toHaveURL(new RegExp(`/orders/new\\?serviceId=${mockService.id}$`));
        expect(api.requests.createdOrders).toHaveLength(0);
    });

    test("muestra error si falla la creación de la orden", async ({ page }) => {
        await mockOrdersApi(page, {
            createError: true,
        });

        await page.goto(`/orders/new?serviceId=${mockService.id}`);

        page.once("dialog", async (dialog) => {
            await dialog.accept();
        });

        await page.getByRole("button", { name: "Crear orden" }).click();

        await expect(page.getByText("No se pudo crear la orden.")).toBeVisible();
    });

    test("si falla la precarga del servicio, permite seleccionar un servicio manualmente", async ({ page }) => {
        await mockOrdersApi(page, {
            serviceError: true,
        });

        await page.goto(`/orders/new?serviceId=${mockService.id}`);

        await expect(
            page.getByText("No se pudo precargar el servicio seleccionado")
        ).toBeVisible();

        await expect(
            page.getByText("Selecciona un servicio para ver su detalle y crear la orden.")
        ).toBeVisible();

        await serviceSelect(page).selectOption(mockService.id);

        await expect(amountInput(page)).toHaveValue(String(mockService.price));
    });

    test("el botón cancelar vuelve al listado", async ({ page }) => {
        await mockOrdersApi(page);

        await page.goto("/orders/new");

        await page.getByRole("button", { name: "Cancelar" }).click();

        await expect(page).toHaveURL(/\/orders$/);
    });
});
