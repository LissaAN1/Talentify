import { apiClient } from "./api-client";

export const paymentsService = {
  // POST /payments/checkout/:orderId
  // Crea la sesión de Stripe Checkout y devuelve la URL a la que hay que redirigir al cliente.
  async createCheckout(orderId: string): Promise<{ url: string }> {
    const { data } = await apiClient.post<{ url: string }>(
      `/payments/checkout/${orderId}`,
    );
    return data;
  },
};
