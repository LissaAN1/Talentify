import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { PayOrderButton } from "@/components/orders/PayOrderButton";
import { OrderStatus } from "@/interfaces/order";

vi.mock("@/services/payments.service", () => ({
  paymentsService: { createCheckout: vi.fn() },
}));

import { paymentsService } from "@/services/payments.service";

describe("PayOrderButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("se muestra solo cuando la orden está PENDING", () => {
    const { rerender } = render(
      <PayOrderButton orderId="o-1" status={OrderStatus.PENDING} />,
    );
    expect(screen.getByRole("button", { name: /pagar con stripe/i })).toBeInTheDocument();

    rerender(<PayOrderButton orderId="o-1" status={OrderStatus.PAID} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("pide la sesión de Checkout con el id de la orden", async () => {
    vi.mocked(paymentsService.createCheckout).mockResolvedValue({ url: "" });

    render(<PayOrderButton orderId="o-1" status={OrderStatus.PENDING} />);
    fireEvent.click(screen.getByRole("button", { name: /pagar con stripe/i }));

    await waitFor(() =>
      expect(paymentsService.createCheckout).toHaveBeenCalledWith("o-1"),
    );
  });

  it("muestra el mensaje del backend si falla el pago", async () => {
    vi.mocked(paymentsService.createCheckout).mockRejectedValue(
      Object.assign(new Error("fallo"), {
        isAxiosError: true,
        response: { data: { message: "La orden ya fue pagada" } },
      }),
    );

    render(<PayOrderButton orderId="o-1" status={OrderStatus.PENDING} />);
    fireEvent.click(screen.getByRole("button", { name: /pagar con stripe/i }));

    expect(await screen.findByText("La orden ya fue pagada")).toBeInTheDocument();
  });
});
