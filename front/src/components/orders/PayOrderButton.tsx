"use client";

import { isAxiosError } from "axios";
import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { OrderStatus } from "@/interfaces/order";
import { paymentsService } from "@/services/payments.service";

type PayOrderButtonProps = {
  orderId: string;
  status: OrderStatus;
};

// Solo se muestra mientras la orden está PENDING. El paso a PAID lo hace el webhook de Stripe.
export function PayOrderButton({ orderId, status }: PayOrderButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== OrderStatus.PENDING) return null;

  async function handlePay() {
    setLoading(true);
    setError(null);

    try {
      const { url } = await paymentsService.createCheckout(orderId);
      window.location.href = url;
    } catch (err: unknown) {
      const message = isAxiosError(err) ? err.response?.data?.message : undefined;
      setError(message || "No se pudo iniciar el pago.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <Alert variant="warning" title="Pago no disponible" message={error} />}
      <Button onClick={handlePay} disabled={loading}>
        {loading ? "Redirigiendo a Stripe..." : "Pagar con Stripe"}
      </Button>
    </div>
  );
}
