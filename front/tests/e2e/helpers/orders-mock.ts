import type { Page, Route } from "@playwright/test";
import {
    Order,
    OrderService,
    OrderStatus,
    OrderUser,
    CreateOrderPayload,
    UpdateOrderStatusPayload,
} from "@/interfaces/order";
import { continueIfFrontendRoute } from "./api-route";

const now = "2026-05-31T10:00:00.000Z";

const clientUser: OrderUser = {
    id: "client-1",
    name: "Cliente Test",
    email: "client@u.icesi.edu.co",
    roles: ["CLIENT"],
    isActive: true,
};

const providerUser: OrderUser = {
    id: "provider-1",
    name: "Proveedor Talentify",
    email: "provider@u.icesi.edu.co",
    roles: ["PROVIDER"],
    isActive: true,
};

export const mockService: OrderService = {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Diseño de logo profesional",
    description: "Diseño de identidad visual para emprendimientos universitarios.",
    price: 50000,
    category: "DESIGN",
    status: "ACTIVE",
    provider: providerUser,
    createdAt: now,
    updatedAt: now,
};

export const pendingOrder: Order = {
    id: "22222222-2222-4222-8222-222222222222",
    user: clientUser,
    service: mockService,
    status: OrderStatus.PENDING,
    notes: "Necesito el logo para una presentación.",
    totalAmount: 50000,
    createdAt: now,
    updatedAt: now,
};

export const completedOrder: Order = {
    id: "33333333-3333-4333-8333-333333333333",
    user: clientUser,
    service: {
        ...mockService,
        id: "44444444-4444-4444-8444-444444444444",
        title: "Landing page básica",
        category: "PROGRAMMING",
        price: 120000,
    },
    status: OrderStatus.COMPLETED,
    notes: null,
    totalAmount: 120000,
    createdAt: now,
    updatedAt: now,
};

type MockOrdersApiOptions = {
    orders?: Order[];
    providerOrders?: Order[];
    listError?: boolean;
    providerListError?: boolean;
    detailError?: boolean;
    detailForbidden?: boolean;
    createError?: boolean;
    updateError?: boolean;
    serviceError?: boolean;
};

export async function mockOrdersApi(page: Page, options: MockOrdersApiOptions = {}) {
    const orders = [...(options.orders ?? [pendingOrder, completedOrder])];

    // Órdenes recibidas por el proveedor autenticado.
    // Esto simula GET /orders/provider.
    const providerOrders = [...(options.providerOrders ?? [pendingOrder])];

    const requests = {
        createdOrders: [] as CreateOrderPayload[],
        statusUpdates: [] as Array<{
            orderId: string;
            payload: UpdateOrderStatusPayload;
        }>,
    };

    function findOrder(id: string) {
        return orders.find((order) => order.id === id);
    }

    function getOrderIdFromUrl(url: string) {
        const pathname = new URL(url).pathname;
        const parts = pathname.split("/");
        return parts[parts.length - 1];
    }

    function getOrderIdFromStatusUrl(url: string) {
        const pathname = new URL(url).pathname;
        const parts = pathname.split("/");
        return parts[parts.length - 2];
    }

    await page.route(/.*\/services$/, async (route: Route) => {
        if (await continueIfFrontendRoute(route)) return;

        if (route.request().method() !== "GET") {
            await route.continue();
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([mockService]),
        });
    });

    await page.route(/.*\/services\/[^/]+$/, async (route: Route) => {
        if (await continueIfFrontendRoute(route)) return;

        if (options.serviceError) {
            await route.fulfill({
                status: 404,
                contentType: "application/json",
                body: JSON.stringify({
                    message: "Servicio no encontrado.",
                }),
            });
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(mockService),
        });
    });

    await page.route(/.*\/orders$/, async (route: Route) => {
        if (await continueIfFrontendRoute(route)) return;

        const request = route.request();
        const method = request.method();

        if (method === "GET") {
            if (options.listError) {
                await route.fulfill({
                    status: 500,
                    contentType: "application/json",
                    body: JSON.stringify({
                        message: "No se pudieron cargar las órdenes.",
                    }),
                });
                return;
            }

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(orders),
            });
            return;
        }

        if (method === "POST") {
            const payload = request.postDataJSON() as CreateOrderPayload;
            requests.createdOrders.push(payload);

            if (options.createError) {
                await route.fulfill({
                    status: 400,
                    contentType: "application/json",
                    body: JSON.stringify({
                        message: "No se pudo crear la orden.",
                    }),
                });
                return;
            }

            const createdOrder: Order = {
                id: "55555555-5555-4555-8555-555555555555",
                user: clientUser,
                service: mockService,
                status: OrderStatus.PENDING,
                notes: payload.notes ?? null,
                totalAmount: payload.totalAmount,
                createdAt: now,
                updatedAt: now,
            };

            orders.push(createdOrder);

            await route.fulfill({
                status: 201,
                contentType: "application/json",
                body: JSON.stringify(createdOrder),
            });
            return;
        }

        await route.continue();
    });

    await page.route("**/orders/provider", async (route: Route) => {
        const request = route.request();

        if (request.method() !== "GET") {
            await route.continue();
            return;
        }

        if (options.providerListError) {
            await route.fulfill({
                status: 500,
                contentType: "application/json",
                body: JSON.stringify({
                    message: "No se pudieron cargar los trabajos recibidos.",
                }),
            });
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(providerOrders),
        });
    });

    await page.route(/.*\/orders\/[0-9a-fA-F-]{36}\/status$/, async (route: Route) => {
        if (await continueIfFrontendRoute(route)) return;

        const request = route.request();
        const orderId = getOrderIdFromStatusUrl(request.url());
        const payload = request.postDataJSON() as UpdateOrderStatusPayload;

        requests.statusUpdates.push({
            orderId,
            payload,
        });

        if (options.updateError) {
            await route.fulfill({
                status: 400,
                contentType: "application/json",
                body: JSON.stringify({
                    message: "Transición no permitida.",
                }),
            });
            return;
        }

        const order = findOrder(orderId);

        if (!order) {
            await route.fulfill({
                status: 404,
                contentType: "application/json",
                body: JSON.stringify({
                    message: "Orden no encontrada.",
                }),
            });
            return;
        }

        const updatedOrder: Order = {
            ...order,
            status: payload.status,
            updatedAt: now,
        };

        const index = orders.findIndex((item) => item.id === orderId);
        orders[index] = updatedOrder;

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(updatedOrder),
        });
    });

    await page.route(/.*\/orders\/[0-9a-fA-F-]{36}$/, async (route: Route) => {
        if (await continueIfFrontendRoute(route)) return;

        const request = route.request();
        const orderId = getOrderIdFromUrl(request.url());

        if (options.detailForbidden) {
            await route.fulfill({
                status: 403,
                contentType: "application/json",
                body: JSON.stringify({
                    message: "No tienes permiso para ver esta orden.",
                }),
            });
            return;
        }

        if (options.detailError || orderId === "00000000-0000-0000-0000-000000000000") {
            await route.fulfill({
                status: 404,
                contentType: "application/json",
                body: JSON.stringify({
                    message: "Orden no encontrada.",
                }),
            });
            return;
        }

        const order = findOrder(orderId);

        if (!order) {
            await route.fulfill({
                status: 404,
                contentType: "application/json",
                body: JSON.stringify({
                    message: "Orden no encontrada.",
                }),
            });
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(order),
        });
    });

    return {
        requests,
        getOrders: () => orders,
    };
}
