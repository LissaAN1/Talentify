// --------------------------------------------------------------------
// tests/unit/components/orders/OrderActions.test.tsx
// Pruebas unitarias del componente OrderActions.
//
// El componente ahora distingue el flujo por modo:
//
// - client:
//   Solo puede cancelar una orden. No puede marcarla como pagada,
//   en progreso ni completada.
//
// - provider/admin:
//   Puede ejecutar las transiciones completas permitidas por
//   ALLOWED_TRANSITIONS.
// --------------------------------------------------------------------

import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import type { Order } from "@/interfaces/order";
import { OrderActions } from "@/components/orders/OrderActions";
import { OrderStatus, ALLOWED_TRANSITIONS, ORDER_STATUS_LABELS } from "@/interfaces/order";

// --------------- Mock del servicio de órdenes ---------------

vi.mock("@/services/orders.service", () => ({
    ordersService: {
        updateStatus: vi.fn(),
    },
}));

import { ordersService } from "@/services/orders.service";

// ── Fábrica de órdenes de prueba ──────────────────────────────

function buildOrder(status: OrderStatus): Order {
    return {
        id: "test-order-id",
        status,
        totalAmount: 100000,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
            id: "user-1",
            name: "Juan Test",
            email: "juan@test.com",
            roles: ["CLIENT"],
            isActive: true,
        },
        service: {
            id: "service-1",
            title: "Diseño de logo",
            description: "Diseño profesional",
            price: 100000,
            category: "DESIGN",
            status: "ACTIVE",
            provider: {
                id: "provider-1",
                name: "María Proveedora",
                email: "maria@test.com",
                roles: ["PROVIDER"],
                isActive: true,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    };
}

describe("OrderActions", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    // ── Estados finales ───────────────────────────────────────

    it("no renderiza nada si la orden está COMPLETED", () => {
        const { container } = render(
            <OrderActions
                order={buildOrder(OrderStatus.COMPLETED)}
                onStatusChanged={vi.fn()}
            />
        );

        expect(container).toBeEmptyDOMElement();
    });

    it("no renderiza nada si la orden está CANCELLED", () => {
        const { container } = render(
            <OrderActions
                order={buildOrder(OrderStatus.CANCELLED)}
                onStatusChanged={vi.fn()}
            />
        );

        expect(container).toBeEmptyDOMElement();
    });

    // ── Modo CLIENT ───────────────────────────────────────────
    // El cliente solo puede cancelar.

    it("en modo client muestra solo 'Cancelar orden' para una orden PENDING", () => {
        render(
            <OrderActions
                order={buildOrder(OrderStatus.PENDING)}
                onStatusChanged={vi.fn()}
                mode="client"
            />
        );

        expect(
            screen.getByRole("button", { name: "Cancelar orden" })
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("button", { name: "Aceptar pedido" })
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole("button", { name: "Iniciar trabajo" })
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole("button", { name: "Marcar como completada" })
        ).not.toBeInTheDocument();
    });

    it("en modo client muestra solo 'Cancelar orden' para una orden PAID", () => {
        render(
            <OrderActions
                order={buildOrder(OrderStatus.PAID)}
                onStatusChanged={vi.fn()}
                mode="client"
            />
        );

        const buttons = screen.getAllByRole("button");

        expect(buttons).toHaveLength(1);
        expect(
            screen.getByRole("button", { name: "Cancelar orden" })
        ).toBeInTheDocument();
    });

    it("en modo client muestra solo 'Cancelar orden' para una orden IN_PROGRESS", () => {
        render(
            <OrderActions
                order={buildOrder(OrderStatus.IN_PROGRESS)}
                onStatusChanged={vi.fn()}
                mode="client"
            />
        );

        const buttons = screen.getAllByRole("button");

        expect(buttons).toHaveLength(1);
        expect(
            screen.getByRole("button", { name: "Cancelar orden" })
        ).toBeInTheDocument();
    });

    // ── Modo PROVIDER ─────────────────────────────────────────
    // El proveedor sí puede ejecutar las transiciones completas.

    it("en modo provider muestra las acciones correctas para PENDING", () => {
        render(
            <OrderActions
                order={buildOrder(OrderStatus.PENDING)}
                onStatusChanged={vi.fn()}
                mode="provider"
            />
        );

        expect(
            screen.getByRole("button", { name: "Aceptar pedido" })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: "Cancelar orden" })
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("button", { name: "Iniciar trabajo" })
        ).not.toBeInTheDocument();
    });

    it("en modo provider muestra las acciones correctas para PAID", () => {
        render(
            <OrderActions
                order={buildOrder(OrderStatus.PAID)}
                onStatusChanged={vi.fn()}
                mode="provider"
            />
        );

        expect(
            screen.getByRole("button", { name: "Iniciar trabajo" })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: "Cancelar orden" })
        ).toBeInTheDocument();
    });

    it("en modo provider muestra las acciones correctas para IN_PROGRESS", () => {
        render(
            <OrderActions
                order={buildOrder(OrderStatus.IN_PROGRESS)}
                onStatusChanged={vi.fn()}
                mode="provider"
            />
        );

        expect(
            screen.getByRole("button", { name: "Marcar como completada" })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: "Cancelar orden" })
        ).toBeInTheDocument();
    });

    // ── Confirmación ──────────────────────────────────────────

    it("no llama a updateStatus si el usuario cancela el confirm", () => {
        vi.spyOn(window, "confirm").mockReturnValue(false);

        render(
            <OrderActions
                order={buildOrder(OrderStatus.PENDING)}
                onStatusChanged={vi.fn()}
                mode="provider"
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Aceptar pedido" }));

        expect(ordersService.updateStatus).not.toHaveBeenCalled();
    });

    it("llama a updateStatus con PAID si el proveedor acepta el pedido", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);

        const order = buildOrder(OrderStatus.PENDING);
        const updatedOrder = { ...order, status: OrderStatus.PAID };

        (ordersService.updateStatus as Mock).mockResolvedValue(updatedOrder);

        const onStatusChanged = vi.fn();

        render(
            <OrderActions
                order={order}
                onStatusChanged={onStatusChanged}
                mode="provider"
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Aceptar pedido" }));

        await waitFor(() => {
            expect(ordersService.updateStatus).toHaveBeenCalledWith(order.id, {
                status: OrderStatus.PAID,
            });
        });

        expect(onStatusChanged).toHaveBeenCalledWith(updatedOrder);
    });

    it("llama a updateStatus con CANCELLED si el cliente cancela la orden", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);

        const order = buildOrder(OrderStatus.PENDING);
        const updatedOrder = { ...order, status: OrderStatus.CANCELLED };

        (ordersService.updateStatus as Mock).mockResolvedValue(updatedOrder);

        const onStatusChanged = vi.fn();

        render(
            <OrderActions
                order={order}
                onStatusChanged={onStatusChanged}
                mode="client"
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Cancelar orden" }));

        await waitFor(() => {
            expect(ordersService.updateStatus).toHaveBeenCalledWith(order.id, {
                status: OrderStatus.CANCELLED,
            });
        });

        expect(onStatusChanged).toHaveBeenCalledWith(updatedOrder);
    });

    // ── Manejo de errores ─────────────────────────────────────

    it("muestra Alert de error si updateStatus lanza excepción con mensaje del backend", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);

        (ordersService.updateStatus as Mock).mockRejectedValue({
            response: { data: { message: "Transición no permitida." } },
        });

        render(
            <OrderActions
                order={buildOrder(OrderStatus.PENDING)}
                onStatusChanged={vi.fn()}
                mode="provider"
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Aceptar pedido" }));

        await waitFor(() => {
            expect(screen.getByText("Transición no permitida.")).toBeInTheDocument();
        });
    });

    it("muestra error genérico si updateStatus falla sin mensaje del backend", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);

        (ordersService.updateStatus as Mock).mockRejectedValue(new Error());

        render(
            <OrderActions
                order={buildOrder(OrderStatus.PENDING)}
                onStatusChanged={vi.fn()}
                mode="provider"
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Aceptar pedido" }));

        await waitFor(() => {
            expect(
                screen.getByText("Ocurrió un error al cambiar el estado.")
            ).toBeInTheDocument();
        });
    });

    it("muestra el primer mensaje si el backend responde con arreglo de errores", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);

        (ordersService.updateStatus as Mock).mockRejectedValue({
            response: {
                data: {
                    message: [
                        "No puedes cambiar esta orden a ese estado.",
                        "Transición inválida.",
                    ],
                },
            },
        });

        render(
            <OrderActions
                order={buildOrder(OrderStatus.PENDING)}
                onStatusChanged={vi.fn()}
                mode="provider"
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Aceptar pedido" }));

        expect(
            await screen.findByText("No puedes cambiar esta orden a ese estado.")
        ).toBeInTheDocument();
    });

    it("muestra estado de carga mientras actualiza el estado", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);

        const order = buildOrder(OrderStatus.PENDING);
        const updatedOrder = { ...order, status: OrderStatus.PAID };

        let resolveRequest!: (value: Order) => void;

        (ordersService.updateStatus as Mock).mockReturnValue(
            new Promise<Order>((resolve) => {
                resolveRequest = resolve;
            })
        );

        const onStatusChanged = vi.fn();

        const { container } = render(
            <OrderActions
                order={order}
                onStatusChanged={onStatusChanged}
                mode="provider"
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Aceptar pedido" }));

        await waitFor(() => {
            expect(
                screen.getByRole("button", { name: "Aceptar pedido" })
            ).toBeDisabled();

            expect(
                screen.getByRole("button", { name: "Cancelar orden" })
            ).toBeDisabled();
        });

        expect(container.querySelector(".animate-spin")).toBeInTheDocument();

        resolveRequest(updatedOrder);

        await waitFor(() => {
            expect(onStatusChanged).toHaveBeenCalledWith(updatedOrder);
        });
    });

    it("usa fallbacks de etiqueta, variante y confirmación si la transición no tiene configuración específica", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);

        const customStatus = "REVIEW" as OrderStatus;
        const originalTransitions = [...ALLOWED_TRANSITIONS[OrderStatus.PENDING]];

        (ALLOWED_TRANSITIONS as Record<string, OrderStatus[]>)[OrderStatus.PENDING] = [
            ...originalTransitions,
            customStatus,
        ];

        (ORDER_STATUS_LABELS as Record<string, string>)[customStatus] = "En revisión";

        const order = buildOrder(OrderStatus.PENDING);
        const updatedOrder = { ...order, status: customStatus };

        (ordersService.updateStatus as Mock).mockResolvedValue(updatedOrder);

        const onStatusChanged = vi.fn();

        try {
            render(
                <OrderActions
                    order={order}
                    onStatusChanged={onStatusChanged}
                    mode="provider"
                />
            );

            fireEvent.click(screen.getByRole("button", { name: "En revisión" }));

            expect(window.confirm).toHaveBeenCalledWith(
                '¿Confirmas cambiar el estado a "En revisión"?'
            );

            await waitFor(() => {
                expect(ordersService.updateStatus).toHaveBeenCalledWith(order.id, {
                    status: customStatus,
                });
            });

            expect(onStatusChanged).toHaveBeenCalledWith(updatedOrder);
        } finally {
            (ALLOWED_TRANSITIONS as Record<string, OrderStatus[]>)[OrderStatus.PENDING] =
                originalTransitions;

            delete (ORDER_STATUS_LABELS as Record<string, string>)[customStatus];
        }
    });

    // ── Cantidad de botones por modo ──────────────────────────

    it.each([
        OrderStatus.PENDING,
        OrderStatus.PAID,
        OrderStatus.IN_PROGRESS,
    ] as const)(
        "en modo provider muestra todas las transiciones permitidas para %s",
        (status) => {
            render(
                <OrderActions
                    order={buildOrder(status)}
                    onStatusChanged={vi.fn()}
                    mode="provider"
                />
            );

            const buttons = screen.getAllByRole("button");

            expect(buttons).toHaveLength(ALLOWED_TRANSITIONS[status].length);
        }
    );

    it.each([
        OrderStatus.PENDING,
        OrderStatus.PAID,
        OrderStatus.IN_PROGRESS,
    ] as const)(
        "en modo client muestra solo cancelar para %s",
        (status) => {
            render(
                <OrderActions
                    order={buildOrder(status)}
                    onStatusChanged={vi.fn()}
                    mode="client"
                />
            );

            const buttons = screen.getAllByRole("button");

            expect(buttons).toHaveLength(1);
            expect(
                screen.getByRole("button", { name: "Cancelar orden" })
            ).toBeInTheDocument();
        }
    );
});
