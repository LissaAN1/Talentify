import { expect, test, type Route } from "@playwright/test";

import { loginAs } from "./helpers/auth";
import { completedOrder, mockOrdersApi, pendingOrder } from "./helpers/orders-mock";

test.describe("HU-19 Pago con Stripe", () => {
    test.beforeEach(async ({ context, baseURL }) => {
        await loginAs(context, "CLIENT", baseURL!);
    });

    test("el cliente ve el botón de pago en una orden PENDING y se crea la sesión de Checkout", async ({ page }) => {
        await mockOrdersApi(page);
        let checkoutOrderId = "";
        await page.route(/.*\/payments\/checkout\/[0-9a-fA-F-]{36}$/, async (route: Route) => {
            checkoutOrderId = route.request().url().split("/").pop() ?? "";
            await route.fulfill({
                status: 201,
                contentType: "application/json",
                // Se redirige a una ruta local para no salir del entorno de pruebas
                body: JSON.stringify({ url: "/orders?payment=redirigido" }),
            });
        });

        await page.goto(`/orders/${pendingOrder.id}`);
        await page.getByRole("button", { name: "Pagar con Stripe" }).click();

        await expect(page).toHaveURL(/payment=redirigido/);
        expect(checkoutOrderId).toBe(pendingOrder.id);
    });

    test("muestra un error si el backend no puede iniciar el pago", async ({ page }) => {
        await mockOrdersApi(page);
        await page.route(/.*\/payments\/checkout\/[0-9a-fA-F-]{36}$/, async (route: Route) => {
            await route.fulfill({
                status: 400,
                contentType: "application/json",
                body: JSON.stringify({ message: "Solo se pueden pagar órdenes pendientes." }),
            });
        });

        await page.goto(`/orders/${pendingOrder.id}`);
        await page.getByRole("button", { name: "Pagar con Stripe" }).click();

        await expect(page.getByText("Solo se pueden pagar órdenes pendientes.")).toBeVisible();
    });

    test("muestra el aviso de pago recibido al volver de Stripe", async ({ page }) => {
        await mockOrdersApi(page);
        await page.goto(`/orders/${pendingOrder.id}?payment=success`);
        await expect(page.getByText("Pago recibido")).toBeVisible();
    });

    test("muestra el aviso de pago cancelado al volver de Stripe", async ({ page }) => {
        await mockOrdersApi(page);
        await page.goto(`/orders/${pendingOrder.id}?payment=cancelled`);
        await expect(page.getByText("Pago cancelado")).toBeVisible();
    });

    test("no ofrece el pago en una orden que ya no está pendiente", async ({ page }) => {
        await mockOrdersApi(page);
        await page.goto(`/orders/${completedOrder.id}`);
        await expect(page.getByRole("button", { name: "Pagar con Stripe" })).toHaveCount(0);
    });
});

test.describe("HU-20 Calificación del proveedor", () => {
    test.beforeEach(async ({ context, baseURL }) => {
        await loginAs(context, "CLIENT", baseURL!);
    });

    test("el cliente califica una orden COMPLETED con puntaje y comentario", async ({ page }) => {
        await mockOrdersApi(page);
        let payload: unknown;
        await page.route("**/ratings", async (route: Route) => {
            if (route.request().method() !== "POST") return route.continue();
            payload = route.request().postDataJSON();
            await route.fulfill({
                status: 201,
                contentType: "application/json",
                body: JSON.stringify({ id: "r-1", score: 4 }),
            });
        });

        await page.goto(`/orders/${completedOrder.id}`);
        await expect(page.getByText("Califica el servicio")).toBeVisible();
        await page.locator('select[name="score"]').selectOption("4");
        await page.locator('textarea[name="comment"]').fill("Muy buen trabajo");
        await page.getByRole("button", { name: "Enviar calificación" }).click();

        await expect(page.getByText("Tu calificación quedó registrada.")).toBeVisible();
        expect(payload).toEqual({ orderId: completedOrder.id, score: 4, comment: "Muy buen trabajo" });
    });

    test("muestra el error si la orden ya fue calificada", async ({ page }) => {
        await mockOrdersApi(page);
        await page.route("**/ratings", async (route: Route) => {
            if (route.request().method() !== "POST") return route.continue();
            await route.fulfill({
                status: 409,
                contentType: "application/json",
                body: JSON.stringify({ message: "Esta orden ya fue calificada." }),
            });
        });

        await page.goto(`/orders/${completedOrder.id}`);
        await page.getByRole("button", { name: "Enviar calificación" }).click();

        await expect(page.getByText("Esta orden ya fue calificada.")).toBeVisible();
    });

    test("no muestra el formulario de calificación si la orden no está completada", async ({ page }) => {
        await mockOrdersApi(page);
        await page.goto(`/orders/${pendingOrder.id}`);
        await expect(page.getByText("Califica el servicio")).toHaveCount(0);
    });
});
