// -------------------------------------------------------------------
// Pruebas unitarias del servicio ordersService:
//
// Estrategia:
//   - Se mockea apiClient con vi.mock para interceptar los llamados
//     axios sin hacer peticiones HTTP reales.
//   - También se mockea localStorage para aislar la lógica del token.
//   - Se prueba cada método del servicio: getAll, getById, create y
//     updateStatus.
// -------------------------------------------------------------------

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock de apiClient ANTES de importar orders.service
// para que el módulo lo reciba ya mockeado.
vi.mock("@/services/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import { ordersService } from "@/services/orders.service";
import { apiClient } from "@/services/api-client";
import { OrderStatus } from "@/interfaces/order";
import type { Order } from "@/interfaces/order";

// -- Helpers de test --------------------------------------

/** Orden de prueba que devuelven los mocks del backend. */
const mockOrder: Order = {
  id: "abc-123",
  status: OrderStatus.PENDING,
  totalAmount: 150000,
  notes: "Entregar urgente",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  user: {
    id: "user-99",
    name: "Cliente Test",
    email: "cliente@test.com",
    roles: ["CLIENT"],
    isActive: true,
  },
  service: {
    id: "svc-55",
    title: "Logo Design",
    description: "Diseño de logo profesional",
    price: 150000,
    category: "DESIGN",
    status: "ACTIVE",
    provider: {
      id: "prov-11",
      name: "Diseñadora Pro",
      email: "pro@design.com",
      roles: ["PROVIDER"],
      isActive: true,
    },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
};

describe("ordersService", () => {
  beforeEach(() => {
    // Simula que hay un token en localStorage.
    // Object.defineProperty es necesario porque jsdom no implementa
    // localStorage de forma completamente reemplazable con vi.spyOn.
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn().mockReturnValue("fake-jwt-token"),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    // Limpia las llamadas registradas entre tests.
    vi.clearAllMocks();
  });

  afterEach(() => {
      vi.unstubAllGlobals();
  });

  // -- getAll --------------------------------------─────────

  describe("getAll()", () => {
    it("llama a GET /orders y devuelve el array de órdenes", async () => {
      // Configura el mock para devolver una lista de una orden.
      vi.mocked(apiClient.get).mockResolvedValue({ data: [mockOrder] });

      const result = await ordersService.getAll();

      // Verifica que se llamó a la URL correcta.
      expect(apiClient.get).toHaveBeenCalledWith(
        "/orders",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer fake-jwt-token",
          }),
        })
      );

      // Verifica que devuelve el array.
      expect(result).toEqual([mockOrder]);
    });

    it("propaga el error si la API falla", async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error("Network Error"));

      await expect(ordersService.getAll()).rejects.toThrow("Network Error");
    });

    it("llama a GET /orders sin Authorization si no hay token en localStorage", async () => {
        Object.defineProperty(window, "localStorage", {
            value: {
                getItem: vi.fn().mockReturnValue(null),
                setItem: vi.fn(),
                removeItem: vi.fn(),
            },
            writable: true,
            configurable: true,
        });

        vi.mocked(apiClient.get).mockResolvedValue({ data: [mockOrder] });

        const result = await ordersService.getAll();

        expect(apiClient.get).toHaveBeenCalledWith("/orders", {
            headers: {},
        });

        expect(result).toEqual([mockOrder]);
    });

    it("llama a GET /orders con headers vacíos si se ejecuta sin window", async () => {
        vi.stubGlobal("window", undefined);

        vi.mocked(apiClient.get).mockResolvedValue({ data: [mockOrder] });

        const result = await ordersService.getAll();

        expect(apiClient.get).toHaveBeenCalledWith("/orders", {
            headers: {},
        });

        expect(result).toEqual([mockOrder]);
    });
  });

  // -- getById --------------------------------------

  describe("getById()", () => {
    it("llama a GET /orders/:id y devuelve la orden", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockOrder });

      const result = await ordersService.getById("abc-123");

      expect(apiClient.get).toHaveBeenCalledWith(
        "/orders/abc-123",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer fake-jwt-token",
          }),
        })
      );

      expect(result).toEqual(mockOrder);
      expect(result.id).toBe("abc-123");
    });

    it("propaga el error si la API falla al consultar una orden", async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error("Order not found"));

      await expect(ordersService.getById("bad-id")).rejects.toThrow(
        "Order not found"
      );
    });
  });

  // -- create --------------------------------------

  describe("getProviderOrders()", () => {
    it("llama a GET /orders/provider y devuelve las órdenes recibidas", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [mockOrder] });

      const result = await ordersService.getProviderOrders();

      expect(apiClient.get).toHaveBeenCalledWith("/orders/provider", expect.any(Object));
      expect(result).toEqual([mockOrder]);
    });

    it("propaga el error si la API falla", async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error("Network Error"));

      await expect(ordersService.getProviderOrders()).rejects.toThrow("Network Error");
    });
  });

  describe("create()", () => {
    it("llama a POST /orders con el payload correcto", async () => {
      const created: Order = { ...mockOrder, id: "new-order" };

      vi.mocked(apiClient.post).mockResolvedValue({ data: created });

      const payload = {
        serviceId: "svc-55",
        totalAmount: 150000,
        notes: "Urgente",
      };

      const result = await ordersService.create(payload);

      // Verifica que el body enviado coincide con el payload.
      expect(apiClient.post).toHaveBeenCalledWith(
        "/orders",
        payload,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer fake-jwt-token",
          }),
        })
      );

      expect(result).toEqual(created);
      expect(result.id).toBe("new-order");
    });

    it("crea la orden sin notes si no se proveen", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockOrder });

      await ordersService.create({
        serviceId: "svc-55",
        totalAmount: 150000,
      });

      // El body no debe incluir notes.
      const [, body] = vi.mocked(apiClient.post).mock.calls[0];

      expect(body).not.toHaveProperty("notes");
    });

    it("propaga el error si la API falla al crear la orden", async () => {
      vi.mocked(apiClient.post).mockRejectedValue(
        new Error("Create order failed")
      );

      await expect(
        ordersService.create({
          serviceId: "svc-55",
          totalAmount: 150000,
          notes: "Urgente",
        })
      ).rejects.toThrow("Create order failed");
    });
  });

  // -- updateStatus --------------------------------------
});
