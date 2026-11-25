// -------------------------------------------------------
// Pruebas unitarias del componente OrderStatusBadge:
//
// Se prueba:
//   1. Que renderiza el texto correcto para cada estado.
//   2. Que no crashea con ningún valor del enum.
//   3. Que acepta className adicional.
// -------------------------------------------------------

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { OrderStatus, ORDER_STATUS_LABELS } from "@/interfaces/order";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

describe("OrderStatusBadge", () => {

  // -------------- Prueba parametrizada: un caso por cada estado --------------
  // Object.values(OrderStatus) devuelve todos los valores del enum, por lo que
  // si se agrega un estado nuevo el test lo captura automáticamente.
  
  it.each(Object.values(OrderStatus))(
    "muestra la etiqueta correcta para el estado %s",
    (status) => {
      render(<OrderStatusBadge status={status} />);

      // Verifica que el texto del badge sea la etiqueta en español.
      expect(
        screen.getByText(ORDER_STATUS_LABELS[status])
      ).toBeInTheDocument();
    }
  );

  it("aplica className adicional al span del badge", () => {
    const { container } = render(
      <OrderStatusBadge status={OrderStatus.PENDING} className="mt-2" />
    );

    // El span del Badge debe tener la clase extra.
    const span = container.querySelector("span");
    expect(span).toHaveClass("mt-2");
  });

  it("muestra 'Pendiente' para el estado PENDING", () => {
    render(<OrderStatusBadge status={OrderStatus.PENDING} />);
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("muestra 'Cancelada' para el estado CANCELLED", () => {
    render(<OrderStatusBadge status={OrderStatus.CANCELLED} />);
    expect(screen.getByText("Cancelada")).toBeInTheDocument();
  });

  it("muestra 'Completada' para el estado COMPLETED", () => {
    render(<OrderStatusBadge status={OrderStatus.COMPLETED} />);
    expect(screen.getByText("Completada")).toBeInTheDocument();
  });
});
