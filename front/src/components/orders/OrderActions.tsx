//Muestra los botones de acción disponibles según el estado actual de la orden. 
// Incluye confirmación nativa antes de ejecutar transiciones destructivas (cancelar) o irreversibles.

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Order,
  OrderStatus,
  ALLOWED_TRANSITIONS,
  ORDER_STATUS_LABELS,
} from "@/interfaces/order";
import { ordersService } from "@/services/orders.service";

//Mensajes de confirmación por estado destino

//Texto del diálogo de confirmación para cada transición.
//Las transiciones destructivas (cancelar) tienen un mensaje más enfático que las progresivas.
const CONFIRMATION_MESSAGES: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.CANCELLED]:
    "¿Estás seguro de que deseas cancelar esta orden? Esta acción no se puede deshacer.",
  [OrderStatus.COMPLETED]:
    "¿Confirmas que la orden ha sido completada satisfactoriamente?",
  [OrderStatus.PAID]:
    "¿Confirmas que el pago de esta orden ha sido recibido?",
  [OrderStatus.IN_PROGRESS]:
    "¿Confirmas que el trabajo en esta orden ya comenzó?",
};

//Variantes de estilo por estado destino

//Colores del botón según el estado de destino para dar pistas visuales: 
//cancelar en rojo, completar en verde, el resto secundario.
const BUTTON_VARIANT: Partial<
  Record<OrderStatus, "primary" | "secondary" | "danger">
> = {
  [OrderStatus.CANCELLED]:   "danger",
  [OrderStatus.COMPLETED]:   "primary",
  [OrderStatus.PAID]:        "secondary",
  [OrderStatus.IN_PROGRESS]: "secondary",
};

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.PAID]: "Aceptar pedido",
  [OrderStatus.IN_PROGRESS]: "Iniciar trabajo",
  [OrderStatus.COMPLETED]: "Marcar como completada",
  [OrderStatus.CANCELLED]: "Cancelar orden",
};

//Tipos del componente

type OrderActionsProps = {
  order: Order;
  //Callback que recibe la orden actualizada tras un cambio exitoso de estado.
  onStatusChanged: (updatedOrder: Order) => void;
  mode?: "client" | "provider" | "admin";
};

/**
 * Renderiza los botones de acción permitidos para la orden.
 *
 * Flujo:
 * 1. Calcula las transiciones posibles desde ALLOWED_TRANSITIONS.
 * 2. Para cada estado destino muestra un botón con su color semántico.
 * 3. Al pulsar, muestra window.confirm con el mensaje apropiado.
 * 4. Si el usuario confirma, llama a ordersService.updateStatus.
 * 5. Muestra un Alert de error si la API devuelve un error.
 * 6. Llama a onStatusChanged con la orden actualizada.
 *
 * Si no hay transiciones posibles (COMPLETED o CANCELLED), no renderiza nada.
 */
export function OrderActions({ order, onStatusChanged, mode = "client", }: OrderActionsProps) {
  //Estado de carga: guarda el estado destino que se está procesando para poder deshabilitar sólo el botón correcto mientras se espera.
  const [loading, setLoading] = useState<OrderStatus | null>(null);

  //Mensaje de error si la API devuelve un error inesperado.
  const [error, setError] = useState<string | null>(null);

  //Estados a los que se puede transicionar desde el estado actual.
  const baseTransitions = ALLOWED_TRANSITIONS[order.status];

  const nextStatuses =
  mode === "client"
    ? baseTransitions.filter((status) => status === OrderStatus.CANCELLED)
    : baseTransitions;

  //Si no hay transiciones, la orden está en estado final → no mostrar nada.
  if (nextStatuses.length === 0) return null;

  /**
   * Maneja el clic en un botón de transición.
   * @param targetStatus - Estado al que se quiere cambiar la orden.
   */
  async function handleAction(targetStatus: OrderStatus) {
    //1. Confirmación nativa antes de proceder.
    const message =
      CONFIRMATION_MESSAGES[targetStatus] ??
      `¿Confirmas cambiar el estado a "${ACTION_LABELS[targetStatus] ?? ORDER_STATUS_LABELS[targetStatus]}"?`;

    if (!window.confirm(message)) return; //El usuario canceló el diálogo.

    setError(null);    //Limpia errores previos.
    setLoading(targetStatus); //Activa estado de carga para este botón.

    try {
      const updated = await ordersService.updateStatus(order.id, {
        status: targetStatus,
      });
      onStatusChanged(updated); //Notifica al padre con la orden fresca.
    } catch (err: unknown) {
      //Extrae el mensaje de error de la respuesta del backend.
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Ocurrió un error al cambiar el estado.";
      setError(typeof msg === "string" ? msg : msg[0]);
    } finally {
      setLoading(null); //Desactiva estado de carga siempre.
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Muestra el error de API si existe */}
      {error && (
        <Alert
          variant="danger"
          title="Error al actualizar"
          message={error}
        />
      )}

      {/* Un botón por cada transición permitida */}
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((targetStatus) => (
          <Button
            key={targetStatus}
            variant={BUTTON_VARIANT[targetStatus] ?? "secondary"}
            size="sm"
            disabled={loading !== null} // Deshabilita todos mientras hay una en curso.
            onClick={() => handleAction(targetStatus)}
          >
            {/* Muestra spinner solo en el botón que se está procesando */}
            {loading === targetStatus ? (
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12" cy="12" r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : null}
            {ACTION_LABELS[targetStatus] ?? ORDER_STATUS_LABELS[targetStatus]}
          </Button>
        ))}
      </div>
    </div>
  );
}
