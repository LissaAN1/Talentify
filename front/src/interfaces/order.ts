// Tipos TypeScript que reflejan el modelo de datos del backend.

//Estados posibles de una orden.
//Deben coincidir EXACTAMENTE con el enum OrderStatus del backend
export enum OrderStatus {
  PENDING     = "PENDING",
  PAID        = "PAID",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED   = "COMPLETED",
  CANCELLED   = "CANCELLED",
}

//Tipos auxiliares

//Subconjunto del usuario necesario en el contexto de una orden.
// El backend devuelve el objeto user completo (sin password) dentro de cada orden al hacer GET /orders o GET /orders/:id.
export interface OrderUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
}

//Subconjunto del servicio necesario en el contexto de una orden.
// El backend devuelve service con sus campos incluyendo provider.
export interface OrderService {
  id: string;
  title: string;
  description: string;
  price: number;           // Precio unitario del servicio
  category: string;        // Enum ServiceCategory del backend
  status: string;          // Enum ServiceStatus del backend
  provider: OrderUser;     // Usuario proveedor del servicio
  createdAt: string;
  updatedAt: string;
}

//Entidad principal

//Representa una orden completa tal como la devuelve el backend.
export interface Order {
  id: string;
  user: OrderUser;
  service: OrderService;
  status: OrderStatus;
  notes: string | null;
  totalAmount: number;     // Decimal en backend → number en JS
  createdAt: string;       // ISO 8601 – se formatea con lib/format.ts
  updatedAt: string;
}

//DTOs de petición

//Cuerpo del POST /orders.
// Refleja CreateOrderDto del backend.
export interface CreateOrderPayload {
  serviceId: string;    // UUID del servicio a contratar
  totalAmount: number;  // Valor total de la orden (≥ 0)
  notes?: string;       // Notas opcionales
}

//Cuerpo del PATCH /orders/:id/status.
//Refleja UpdateOrderStatusDto del backend.
export interface UpdateOrderStatusPayload {
  status: OrderStatus;
}

//Mapa de transiciones permitidas

//Replica en el frontend las transiciones válidas del backend
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]:     [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]:        [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]:   [],
  [OrderStatus.CANCELLED]:   [],
};

//Helpers de presentación

//Etiquetas legibles en español para cada estado.
//Se usan en el badge y en los botones de acción.
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]:     "Pendiente",
  [OrderStatus.PAID]:        "Pagada",
  [OrderStatus.IN_PROGRESS]: "En progreso",
  [OrderStatus.COMPLETED]:   "Completada",
  [OrderStatus.CANCELLED]:   "Cancelada",
};
