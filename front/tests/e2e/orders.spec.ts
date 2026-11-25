import { expect, test, type Page } from "@playwright/test";

import { OrderStatus } from "@/interfaces/order";
import { loginAs } from "./helpers/auth";
import {
    completedOrder,
    mockOrdersApi,
    mockService,
    pendingOrder,
} from "./helpers/orders-mock";

const serviceSelect = (page: Page) => page.locator('select[name="serviceId"]');
const selectedServiceInput = (page: Page) => page.locator('input[name="serviceName"]');
const amountInput = (page: Page) => page.locator('input[name="totalAmount"]');

test.describe("Orders", () => {
    test.beforeEach(async ({ context, baseURL }) => {
        await loginAs(context, "CLIENT", baseURL!);
    });

    test("muestra listado de órdenes con tabla, estados y enlace al detalle", async ({ page }) => {
        await mockOrdersApi(page);

        await page.goto("/orders");

        await expect(page.getByRole("heading", { name: "Órdenes" })).toBeVisible();
        await expect(page.getByText("Diseño de logo profesional")).toBeVisible();
        await expect(page.getByText("Landing page básica")).toBeVisible();

        await expect(page.getByText("Pendiente")).toBeVisible();
        await expect(page.getByText("Completada")).toBeVisible();

        await expect(page.getByRole("link", { name: /^ver$/i }).first()).toBeVisible();
    });

    test("muestra estado vacío cuando no hay órdenes", async ({ page }) => {
        await mockOrdersApi(page, {
            orders: [],
        });

        await page.goto("/orders");

        await expect(page.getByText("Aún no tienes pedidos")).toBeVisible();
        await expect(page.getByText("Cuando contrates un servicio desde el marketplace")).toBeVisible();
        await expect(page.getByRole("link", { name: "Explorar marketplace" })).toBeVisible();
    });

    test("muestra alerta de error si falla la carga del listado", async ({ page }) => {
        await mockOrdersApi(page, {
            listError: true,
        });

        await page.goto("/orders");

        await expect(page.getByText("Error al cargar órdenes")).toBeVisible();
        await expect(page.getByText(/No se pudieron cargar las órdenes/i)).toBeVisible();
    });

    test("cada pedido expone el enlace correcto al detalle de la orden", async ({ page }) => {
        await mockOrdersApi(page);

        await page.goto("/orders");

        const detailLink = page.getByRole("link", { name: /^ver$/i }).first();

        await expect(detailLink).toBeVisible();
        await expect(detailLink).toHaveAttribute("href", `/orders/${pendingOrder.id}`);
    });

    test("muestra error cuando el detalle de la orden no existe", async ({ page }) => {
        await mockOrdersApi(page);

        await page.goto("/orders/00000000-0000-0000-0000-000000000000");

        await expect(page.getByText("No se pudo cargar la orden")).toBeVisible();
        await expect(page.getByText("Orden no encontrada.")).toBeVisible();
    });

    test("muestra error 403 cuando no tiene permiso para ver una orden", async ({ page }) => {
        await mockOrdersApi(page, {
            detailForbidden: true,
        });

        await page.goto(`/orders/${pendingOrder.id}`);

        await expect(page.getByText("No se pudo cargar la orden")).toBeVisible();
        await expect(page.getByText("No tienes permiso para ver esta orden.")).toBeVisible();
    });

    test("actualiza el estado de una orden cuando el proveedor confirma", async ({ page, context, baseURL }) => {
        await loginAs(context, "PROVIDER", baseURL!);

        const api = await mockOrdersApi(page);

        await page.goto(`/orders/${pendingOrder.id}`);

        page.once("dialog", async (dialog) => {
            await dialog.accept();
        });

        await page.getByRole("button", { name: "Aceptar pedido" }).click();

        await expect(page.getByText("Pagada").first()).toBeVisible();

        expect(api.requests.statusUpdates).toHaveLength(1);
        expect(api.requests.statusUpdates[0]).toMatchObject({
            orderId: pendingOrder.id,
            payload: {
                status: OrderStatus.PAID,
            },
        });
    });

    test("no actualiza el estado si el usuario cancela la confirmación", async ({ page }) => {
        const api = await mockOrdersApi(page);

        await page.goto(`/orders/${pendingOrder.id}`);

        page.once("dialog", async (dialog) => {
            await dialog.dismiss();
        });

        await page.getByRole("button", { name: "Cancelar orden" }).click();

        await expect(page.getByText("Pendiente").first()).toBeVisible();
        expect(api.requests.statusUpdates).toHaveLength(0);
    });

    test("muestra error si el backend rechaza el cambio de estado", async ({ page, context, baseURL }) => {
        await loginAs(context, "PROVIDER", baseURL!);

        await mockOrdersApi(page, {
            updateError: true,
        });

        await page.goto(`/orders/${pendingOrder.id}`);

        page.once("dialog", async (dialog) => {
            await dialog.accept();
        });

        await page.getByRole("button", { name: "Aceptar pedido" }).click();

        await expect(page.getByText("Transición no permitida.")).toBeVisible();
    });

    test("no muestra acciones si la orden está en estado final", async ({ page }) => {
        await mockOrdersApi(page);

        await page.goto(`/orders/${completedOrder.id}`);

        await expect(page.getByText("Completada").first()).toBeVisible();
        await expect(page.getByText("Acciones disponibles")).toBeVisible();

        await expect(page.getByRole("button", { name: "Pagada" })).toHaveCount(0);
        await expect(page.getByRole("button", { name: "En progreso" })).toHaveCount(0);
        await expect(page.getByRole("button", { name: "Cancelada" })).toHaveCount(0);
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
        await expect(page.getByRole("heading", { name: "Diseño de logo profesional" })).toBeVisible();

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
