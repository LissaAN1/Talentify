// Badge reutilizable que muestra el estado de una orden con color semántico. 
// Construido sobre el componente Badge genérico de la UI.

import { Badge } from "@/components/ui/Badge";
import { OrderStatus, ORDER_STATUS_LABELS } from "@/interfaces/order";

/**
 * Mapea cada estado a la variante de color del componente Badge.
  * success (verde)  → orden completada
  * blue             → orden pagada
  * warning (ámbar)  → en progreso
  * danger (rojo)    → cancelada
  * neutral (gris)   → pendiente
**/
const STATUS_VARIANT: Record<
  OrderStatus,
  "success" | "warning" | "danger" | "neutral" | "blue"
> = {
  [OrderStatus.PENDING]:     "neutral",
  [OrderStatus.PAID]:        "blue",
  [OrderStatus.IN_PROGRESS]: "warning",
  [OrderStatus.COMPLETED]:   "success",
  [OrderStatus.CANCELLED]:   "danger",
};

type OrderStatusBadgeProps = {
  status: OrderStatus;   //Estado que se quiere visualizar
  className?: string;    //Clases extra opcionales para ajustes de layout
};

//Muestra el estado de una orden como badge coloreado con etiqueta en español.
export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={className}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
