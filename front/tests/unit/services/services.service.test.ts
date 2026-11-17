import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

// ─── Mock del apiClient ───────────────────────────────────────────────────────
vi.mock("@/services/api-client", () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

import { apiClient } from "@/services/api-client";
import { servicesService } from "@/services/services.service";
import {
    ServiceCategory,
    ServiceStatus,
} from "@/interfaces/service";

// ─── Typed mock helpers ───────────────────────────────────────────────────────
const mockedApiClient = apiClient as unknown as {
    get: Mock;
    post: Mock;
    put: Mock;
    delete: Mock;
};

// ─── Datos de prueba ──────────────────────────────────────────────────────────

/** Objeto tal como lo devuelve el backend (con status, sin isActive) */
const rawActiveService = {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Desarrollo de landing page",
    description: "Landing page moderna para tu negocio.",
    price: 120000,
    category: ServiceCategory.PROGRAMMING,
    status: ServiceStatus.ACTIVE,
    provider: {
        id: "provider-1",
        name: "Proveedor Test",
        email: "provider@u.icesi.edu.co",
        roles: ["PROVIDER"],
        isActive: true,
    },
    createdAt: "2026-05-31T10:00:00.000Z",
    updatedAt: "2026-05-31T10:00:00.000Z",
};

const rawInactiveService = {
    ...rawActiveService,
    id: "22222222-2222-4222-8222-222222222222",
    title: "Fotografía de producto",
    status: ServiceStatus.INACTIVE,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("servicesService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── findAll ───────────────────────────────────────────────────────────────

    describe("findAll", () => {
        it("llama a GET /services y devuelve un array de servicios mapeados", async () => {
            mockedApiClient.get.mockResolvedValue({ data: [rawActiveService] });

            const result = await servicesService.findAll();

            expect(mockedApiClient.get).toHaveBeenCalledWith("/services");
            expect(result).toHaveLength(1);
        });

        it("mapea status ACTIVE → isActive: true", async () => {
            mockedApiClient.get.mockResolvedValue({ data: [rawActiveService] });

            const [service] = await servicesService.findAll();

            expect(service.isActive).toBe(true);
            expect(service.status).toBe(ServiceStatus.ACTIVE);
        });

        it("mapea status INACTIVE → isActive: false", async () => {
            mockedApiClient.get.mockResolvedValue({ data: [rawInactiveService] });

            const [service] = await servicesService.findAll();

            expect(service.isActive).toBe(false);
            expect(service.status).toBe(ServiceStatus.INACTIVE);
        });

        it("devuelve un array vacío si el backend no retorna servicios", async () => {
            mockedApiClient.get.mockResolvedValue({ data: [] });

            const result = await servicesService.findAll();

            expect(result).toEqual([]);
        });

        it("propaga el error cuando el backend falla", async () => {
            mockedApiClient.get.mockRejectedValue(new Error("Error de red"));

            await expect(servicesService.findAll()).rejects.toThrow("Error de red");
        });
    });

    // ── findMyServices ────────────────────────────────────────────────────────

    describe("findMyServices", () => {
        it("llama a GET /services/my", async () => {
            mockedApiClient.get.mockResolvedValue({
                data: [rawActiveService, rawInactiveService],
            });

            const result = await servicesService.findMyServices();

            expect(mockedApiClient.get).toHaveBeenCalledWith("/services/my");
            expect(result).toHaveLength(2);
        });

        it("mapea correctamente los status de todos los servicios propios", async () => {
            mockedApiClient.get.mockResolvedValue({
                data: [rawActiveService, rawInactiveService],
            });

            const [active, inactive] = await servicesService.findMyServices();

            expect(active.isActive).toBe(true);
            expect(inactive.isActive).toBe(false);
        });
    });

    // ── findOne ───────────────────────────────────────────────────────────────

    describe("findOne", () => {
        it("llama a GET /services/:id con el id correcto", async () => {
            mockedApiClient.get.mockResolvedValue({ data: rawActiveService });

            await servicesService.findOne(rawActiveService.id);

            expect(mockedApiClient.get).toHaveBeenCalledWith(
                `/services/${rawActiveService.id}`,
            );
        });

        it("devuelve el servicio mapeado con isActive: true", async () => {
            mockedApiClient.get.mockResolvedValue({ data: rawActiveService });

            const service = await servicesService.findOne(rawActiveService.id);

            expect(service.id).toBe(rawActiveService.id);
            expect(service.title).toBe(rawActiveService.title);
            expect(service.isActive).toBe(true);
            expect(service.status).toBe(ServiceStatus.ACTIVE);
        });

        it("devuelve el servicio mapeado con isActive: false para un servicio inactivo", async () => {
            mockedApiClient.get.mockResolvedValue({ data: rawInactiveService });

            const service = await servicesService.findOne(rawInactiveService.id);

            expect(service.isActive).toBe(false);
        });

        it("propaga el error 404 del backend", async () => {
            const notFoundError = new Error("No se encontró un servicio con ese id");
            mockedApiClient.get.mockRejectedValue(notFoundError);

            await expect(
                servicesService.findOne("00000000-0000-0000-0000-000000000000"),
            ).rejects.toThrow("No se encontró un servicio con ese id");
        });
    });

    // ── create ────────────────────────────────────────────────────────────────

    describe("create", () => {
        const createDto = {
            title: "Nuevo servicio",
            description: "Descripción del nuevo servicio de prueba.",
            category: ServiceCategory.DESIGN,
            price: 75000,
        };

        it("llama a POST /services con el DTO correcto", async () => {
            mockedApiClient.post.mockResolvedValue({ data: rawActiveService });

            await servicesService.create(createDto);

            expect(mockedApiClient.post).toHaveBeenCalledWith("/services", createDto);
        });

        it("devuelve el servicio creado con isActive: true", async () => {
            mockedApiClient.post.mockResolvedValue({ data: rawActiveService });

            const service = await servicesService.create(createDto);

            expect(service.isActive).toBe(true);
            expect(service.title).toBe(rawActiveService.title);
        });

        it("propaga el error de validación del backend", async () => {
            mockedApiClient.post.mockRejectedValue(new Error("Datos inválidos"));

            await expect(servicesService.create(createDto)).rejects.toThrow("Datos inválidos");
        });
    });

    // ── update ────────────────────────────────────────────────────────────────

    describe("update", () => {
        const updateDto = { title: "Título actualizado" };

        it("llama a PUT /services/:id con el id y el DTO correctos", async () => {
            mockedApiClient.put.mockResolvedValue({ data: rawActiveService });

            await servicesService.update(rawActiveService.id, updateDto);

            expect(mockedApiClient.put).toHaveBeenCalledWith(
                `/services/${rawActiveService.id}`,
                updateDto,
            );
        });

        it("devuelve el servicio actualizado mapeado", async () => {
            const updated = { ...rawActiveService, title: "Título actualizado" };
            mockedApiClient.put.mockResolvedValue({ data: updated });

            const service = await servicesService.update(rawActiveService.id, updateDto);

            expect(service.title).toBe("Título actualizado");
            expect(service.isActive).toBe(true);
        });

        it("propaga el error 403 cuando el proveedor intenta editar un servicio ajeno", async () => {
            const forbidden = new Error("No tienes permisos para modificar este servicio");
            mockedApiClient.put.mockRejectedValue(forbidden);

            await expect(
                servicesService.update("otro-uuid", updateDto),
            ).rejects.toThrow("No tienes permisos para modificar este servicio");
        });
    });

    // ── remove ────────────────────────────────────────────────────────────────

    describe("remove", () => {
        it("llama a DELETE /services/:id con el id correcto", async () => {
            const deactivated = { ...rawActiveService, status: ServiceStatus.INACTIVE };
            mockedApiClient.delete.mockResolvedValue({ data: deactivated });

            await servicesService.remove(rawActiveService.id);

            expect(mockedApiClient.delete).toHaveBeenCalledWith(
                `/services/${rawActiveService.id}`,
            );
        });

        it("devuelve el servicio desactivado con isActive: false", async () => {
            const deactivated = { ...rawActiveService, status: ServiceStatus.INACTIVE };
            mockedApiClient.delete.mockResolvedValue({ data: deactivated });

            const service = await servicesService.remove(rawActiveService.id);

            expect(service.isActive).toBe(false);
            expect(service.status).toBe(ServiceStatus.INACTIVE);
        });

        it("propaga el error 403 cuando el proveedor intenta eliminar un servicio ajeno", async () => {
            const forbidden = new Error("No tienes permisos para eliminar este servicio");
            mockedApiClient.delete.mockRejectedValue(forbidden);

            await expect(
                servicesService.remove("otro-uuid"),
            ).rejects.toThrow("No tienes permisos para eliminar este servicio");
        });

        it("propaga el error 404 cuando el servicio no existe", async () => {
            mockedApiClient.delete.mockRejectedValue(new Error("Servicio no encontrado"));

            await expect(
                servicesService.remove("00000000-0000-0000-0000-000000000000"),
            ).rejects.toThrow("Servicio no encontrado");
        });
    });

    // ── Preservación de campos del provider ───────────────────────────────────

    describe("mapeo del proveedor", () => {
        it("preserva la información del provider en el objeto mapeado", async () => {
            mockedApiClient.get.mockResolvedValue({ data: rawActiveService });

            const service = await servicesService.findOne(rawActiveService.id);

            expect(service.provider).toBeDefined();
            expect(service.provider?.id).toBe(rawActiveService.provider.id);
            expect(service.provider?.name).toBe(rawActiveService.provider.name);
            expect(service.provider?.email).toBe(rawActiveService.provider.email);
        });

        it("maneja correctamente servicios sin provider (undefined)", async () => {
            const rawWithoutProvider = { ...rawActiveService, provider: undefined };
            mockedApiClient.get.mockResolvedValue({ data: rawWithoutProvider });

            const service = await servicesService.findOne(rawActiveService.id);

            expect(service.provider).toBeUndefined();
        });
    });
});
