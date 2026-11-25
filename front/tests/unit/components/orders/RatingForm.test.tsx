import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { RatingForm } from "@/components/orders/RatingForm";
import { OrderStatus } from "@/interfaces/order";

vi.mock("@/services/ratings.service", () => ({
  ratingsService: { create: vi.fn() },
}));

import { ratingsService } from "@/services/ratings.service";

describe("RatingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no se muestra si la orden no está COMPLETED", () => {
    render(<RatingForm orderId="o-1" status={OrderStatus.IN_PROGRESS} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("envía el puntaje y el comentario", async () => {
    vi.mocked(ratingsService.create).mockResolvedValue({} as never);

    render(<RatingForm orderId="o-1" status={OrderStatus.COMPLETED} />);

    fireEvent.change(screen.getByLabelText("Puntaje"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText(/comentario/i), {
      target: { value: "Muy buen trabajo" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enviar calificación/i }));

    await waitFor(() =>
      expect(ratingsService.create).toHaveBeenCalledWith({
        orderId: "o-1",
        score: 4,
        comment: "Muy buen trabajo",
      }),
    );
    expect(await screen.findByText("Tu calificación quedó registrada.")).toBeInTheDocument();
  });

  it("muestra el error si la orden ya fue calificada (409)", async () => {
    vi.mocked(ratingsService.create).mockRejectedValue(
      Object.assign(new Error("fallo"), {
        isAxiosError: true,
        response: { data: { message: "Esta orden ya fue calificada" } },
      }),
    );

    render(<RatingForm orderId="o-1" status={OrderStatus.COMPLETED} />);
    fireEvent.click(screen.getByRole("button", { name: /enviar calificación/i }));

    expect(await screen.findByText("Esta orden ya fue calificada")).toBeInTheDocument();
  });
});
