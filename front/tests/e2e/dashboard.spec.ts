import { expect, test, type Page } from "@playwright/test";

import { loginAs } from "./helpers/auth";
import { mockOrdersApi } from "./helpers/orders-mock";
import { mockServicesApi } from "./helpers/services-mock";
import { mockUsersApi } from "./helpers/users-mock";

async function mockDashboardApi(page: Page) {
    await mockOrdersApi(page);
    await mockUsersApi(page);
    await mockServicesApi(page);
}

test.describe("Dashboard", () => {
    test("ADMIN ve métricas, acciones generales y resumen de actividad", async ({
        page,
        context,
        baseURL,
    }) => {
        await mockDashboardApi(page);
        await loginAs(context, "ADMIN", baseURL!);

        await page.goto("/dashboard");

        await expect(page.getByText("Servicios activos")).toBeVisible();
        await expect(page.getByText("Órdenes abiertas")).toBeVisible();
        await expect(page.locator("article").filter({ hasText: "Usuarios" })).toBeVisible();

        await expect(page.getByText("Acciones rápidas")).toBeVisible();
        await expect(page.getByRole("link", { name: "Explorar marketplace" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Ver órdenes" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Publicar servicio" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Administrar usuarios" })).toBeVisible();

        await expect(page.getByText("Resumen de actividad")).toBeVisible();
        await expect(page.getByText("Ingresos por órdenes completadas")).toBeVisible();
    });

    test("PROVIDER ve publicar servicio pero no administrar usuarios", async ({
        page,
        context,
        baseURL,
    }) => {
        await mockDashboardApi(page);
        await loginAs(context, "PROVIDER", baseURL!);

        await page.goto("/dashboard");

        await expect(page.getByText("Órdenes abiertas")).toBeVisible();
        await expect(page.getByText("Acciones rápidas")).toBeVisible();

        await expect(page.getByRole("link", { name: "Explorar marketplace" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Ver órdenes" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Publicar servicio" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Administrar usuarios" })).toHaveCount(0);

        await expect(page.getByText("Resumen de actividad")).toBeVisible();
    });

    test("CLIENT no ve acciones de proveedor ni administración", async ({
        page,
        context,
        baseURL,
    }) => {
        await mockDashboardApi(page);
        await loginAs(context, "CLIENT", baseURL!);

        await page.goto("/dashboard");

        await expect(page.getByText("Órdenes abiertas")).toBeVisible();
        await expect(page.getByText("Acciones rápidas")).toBeVisible();

        await expect(page.getByRole("link", { name: "Explorar marketplace" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Ver órdenes" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Publicar servicio" })).toHaveCount(0);
        await expect(page.getByRole("link", { name: "Administrar usuarios" })).toHaveCount(0);

        await expect(page.getByText("Resumen de actividad")).toBeVisible();
    });
});
