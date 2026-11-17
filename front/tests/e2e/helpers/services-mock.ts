import type { Page, Route } from "@playwright/test";
import { continueIfFrontendRoute } from "./api-route";
import { ServiceStatus } from "@/interfaces/service";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type MockServiceProvider = {
    id: string;
    name: string;
    email: string;
    roles: string[];
    isActive: boolean;
};

export type MockService = {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    status: ServiceStatus;
    provider: MockServiceProvider;
    createdAt: string;
    updatedAt: string;
};

// ─── Datos de prueba ─────────────────────────────────────────────────────────

const now = "2026-05-31T10:00:00.000Z";

export const providerUser: MockServiceProvider = {
    id: "provider-1",
    name: "Proveedor Talentify",
    email: "provider@u.icesi.edu.co",
    roles: ["PROVIDER"],
    isActive: true,
};

export const otherProviderUser: MockServiceProvider = {
    id: "provider-2",
    name: "Otro Proveedor",
    email: "otro@u.icesi.edu.co",
    roles: ["PROVIDER"],
    isActive: true,
};

export const activeServiceProgramming: MockService = {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Desarrollo de landing page",
    description: "Landing page moderna y responsiva para tu negocio o emprendimiento.",
    price: 120000,
    category: "PROGRAMMING",
    status: ServiceStatus.ACTIVE,
    provider: providerUser,
    createdAt: now,
    updatedAt: now,
};

export const activeServiceDesign: MockService = {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Diseño de logo",
    description: "Logo profesional para marca personal o empresa.",
    price: 50000,
    category: "DESIGN",
    status: ServiceStatus.ACTIVE,
    provider: providerUser,
    createdAt: now,
    updatedAt: now,
};

export const activeServiceVideo: MockService = {
    id: "44444444-4444-4444-8444-444444444444",
    title: "Edición de reels",
    description: "Edición profesional de reels para Instagram y TikTok.",
    price: 30000,
    category: "VIDEO",
    status: ServiceStatus.ACTIVE,
    provider: otherProviderUser,
    createdAt: now,
    updatedAt: now,
};

export const inactiveService: MockService = {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Fotografía de producto",
    description: "Sesión fotográfica para catálogos y tiendas online.",
    price: 80000,
    category: "PHOTOGRAPHY",
    status: ServiceStatus.INACTIVE,
    provider: providerUser,
    createdAt: now,
    updatedAt: now,
};

/** Servicios activos visibles en el marketplace */
export const defaultActiveServices: MockService[] = [
    activeServiceProgramming,
    activeServiceDesign,
    activeServiceVideo,
];

/** Todos los servicios del proveedor (activos e inactivos) */
export const defaultMyServices: MockService[] = [
    activeServiceProgramming,
    activeServiceDesign,
    inactiveService,
];

// ─── Opciones del mock ────────────────────────────────────────────────────────

type MockServicesApiOptions = {
    /** Servicios a devolver en GET /services (por defecto: defaultActiveServices) */
    activeServices?: MockService[];
    /** Servicios a devolver en GET /services/my (por defecto: defaultMyServices) */
    myServices?: MockService[];
    /** Servicio individual para GET /services/:id y como respuesta de PUT/DELETE */
    singleService?: MockService;
    /** Simula error en GET /services */
    listError?: boolean;
    /** Simula error en GET /services/my */
    myServicesError?: boolean;
    /** Simula error en GET /services/:id */
    detailError?: boolean;
    /** Simula error en POST /services */
    createError?: boolean;
    /** Simula error en PUT /services/:id */
    updateError?: boolean;
    /** Simula error en DELETE /services/:id */
    deleteError?: boolean;
};

// ─── Función principal del mock ───────────────────────────────────────────────

export async function mockServicesApi(page: Page, options: MockServicesApiOptions = {}) {
    const activeServices = [...(options.activeServices ?? defaultActiveServices)];
    const myServices = [...(options.myServices ?? defaultMyServices)];

    const requests = {
        createdServices: [] as unknown[],
        updatedServices: [] as unknown[],
        deletedIds: [] as string[],
    };

    function getServiceIdFromUrl(url: string) {
        const pathname = new URL(url).pathname;
        const parts = pathname.split("/");
        return parts[parts.length - 1];
    }

    function findInAll(id: string): MockService | undefined {
        return [...activeServices, ...myServices, inactiveService].find((s) => s.id === id);
    }

    // ── GET/POST /services (sin segmento adicional) ──────────────────────────
    await page.route(/.*\/services$/, async (route: Route) => {
        if (await continueIfFrontendRoute(route)) return;

        const method = route.request().method();

        if (method === "GET") {
            if (options.listError) {
                await route.fulfill({
                    status: 500,
                    contentType: "application/json",
                    body: JSON.stringify({ message: "Error interno del servidor." }),
                });
                return;
            }
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(activeServices),
            });
            return;
        }

        if (method === "POST") {
            if (options.createError) {
                await route.fulfill({
                    status: 400,
                    contentType: "application/json",
                    body: JSON.stringify({ message: "Error al crear el servicio." }),
                });
                return;
            }
            const body = route.request().postDataJSON();
            const created: MockService = {
                id: "99999999-9999-4999-8999-999999999999",
                ...body,
                status: ServiceStatus.ACTIVE,
                provider: providerUser,
                createdAt: now,
                updatedAt: now,
            };
            requests.createdServices.push(created);
            activeServices.push(created);
            await route.fulfill({
                status: 201,
                contentType: "application/json",
                body: JSON.stringify(created),
            });
            return;
        }

        await route.continue();
    });

    // ── GET/PUT/DELETE /services/:id ─────────────────────────────────────────
    await page.route(/.*\/services\/[\w-]+$/, async (route: Route) => {
        if (await continueIfFrontendRoute(route)) return;

        const method = route.request().method();
        const id = getServiceIdFromUrl(route.request().url());
        const service = options.singleService ?? findInAll(id);

        if (method === "GET") {
            if (options.detailError || !service) {
                await route.fulfill({
                    status: 404,
                    contentType: "application/json",
                    body: JSON.stringify({ message: "Servicio no encontrado." }),
                });
                return;
            }
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(service),
            });
            return;
        }

        if (method === "PUT") {
            if (options.updateError || !service) {
                await route.fulfill({
                    status: 400,
                    contentType: "application/json",
                    body: JSON.stringify({ message: "Error al actualizar el servicio." }),
                });
                return;
            }
            const body = route.request().postDataJSON();
            const updated = { ...service, ...body, updatedAt: now };
            requests.updatedServices.push(updated);
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(updated),
            });
            return;
        }

        if (method === "DELETE") {
            if (options.deleteError || !service) {
                await route.fulfill({
                    status: 400,
                    contentType: "application/json",
                    body: JSON.stringify({ message: "Error al desactivar el servicio." }),
                });
                return;
            }
            const deactivated = { ...service, status: ServiceStatus.INACTIVE };
            requests.deletedIds.push(id);
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(deactivated),
            });
            return;
        }

        await route.continue();
    });

    // ── GET /services/my ─────────────────────────────────────────────────────
    // Se registra AL FINAL para tener mayor prioridad en Playwright (LIFO):
    // la ruta /[\w-]+$/ también coincide con "my", por eso /my debe ir después.
    await page.route(/.*\/services\/my$/, async (route: Route) => {
        if (await continueIfFrontendRoute(route)) return;

        if (options.myServicesError) {
            await route.fulfill({
                status: 500,
                contentType: "application/json",
                body: JSON.stringify({ message: "Error al cargar tus servicios." }),
            });
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(myServices),
        });
    });

    return requests;
}
 
