// Encapsula TODOS los llamados HTTP al recurso /orders del backend.
// Centralizar aquí la lógica de red permite: 
// mockear fácilmente en tests, cambiar la baseURL en un solo lugar y manejar el token JWT de forma consistente.

import { apiClient } from "./api-client";
import type {
  Order,
  CreateOrderPayload,
  UpdateOrderStatusPayload,
} from "@/interfaces/order";

//Helpers internos

//Lee el token de acceso guardado en localStorage por la capa de auth.
// Se incluye en cada petición como Bearer Token.
// Si no existe, axios lanza 401 y el interceptor global redirige al login.
function getAuthHeader(): Record<string, string> {
  //Sólo se puede acceder a localStorage en el cliente (no en SSR).
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

//Métodos del servicio

export const ordersService = {
  //GET /orders
  //Devuelve todas las órdenes del usuario autenticado, ordenadas por fecha de creación descendente (lo hace el backend).
  async getAll(): Promise<Order[]> {
    const { data } = await apiClient.get<Order[]>("/orders", {
      headers: getAuthHeader(),
    });
    return data;
  },

  //GET /orders/:orderId
  //Devuelve el detalle completo de una orden con sus relaciones (user y service cargados).
  //El backend valida que la orden pertenezca al usuario autenticado (403 si no es así).
  async getById(orderId: string): Promise<Order> {
    const { data } = await apiClient.get<Order>(`/orders/${orderId}`, {
      headers: getAuthHeader(),
    });
    return data;
  },

  //POST /orders Crea una nueva orden con estado inicial PENDING.
  async create(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await apiClient.post<Order>("/orders", payload, {
      headers: getAuthHeader(),
    });
    return data;
  },

  async getProviderOrders(): Promise<Order[]> {
    const { data } = await apiClient.get<Order[]>("/orders/provider", {
      headers: getAuthHeader(),
    });
    return data;
  },
  
  //PATCH /orders/:orderId/status
  //Actualiza el estado de una orden según las transiciones permitidas
  //(PENDING→PAID, PAID→IN_PROGRESS, IN_PROGRESS→COMPLETED, cualquiera→CANCELLED).
  //El backend lanza 400 si la transición no es válida.
  async updateStatus(
    orderId: string,
    payload: UpdateOrderStatusPayload
  ): Promise<Order> {
    const { data } = await apiClient.patch<Order>(
      `/orders/${orderId}/status`,
      payload,
      { headers: getAuthHeader() }
    );
    return data;
  },
};
