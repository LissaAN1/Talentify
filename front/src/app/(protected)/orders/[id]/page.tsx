//Página de detalle de una orden específica.
//Muestra todos sus campos, el estado actual y los botones de acción para transicionar al siguiente estado.

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderActions } from "@/components/orders/OrderActions";

import { useAuth } from "@/hooks/useAuth";
import { ordersService } from "@/services/orders.service";
import type { Order } from "@/interfaces/order";
import { formatCurrencyCOP, formatDate } from "@/lib/format";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const router = useRouter();

  const { user, isAdmin, isProvider } = useAuth();

  //Orden cargada; null mientras carga o si hubo error.
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //Carga la orden por ID al montar el componente.
  useEffect(() => {
    if (!id) return;

    async function fetchOrder() {
      try {
        const data = await ordersService.getById(id);
        setOrder(data);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;

        //Mensajes diferenciados según el código HTTP del backend.
        if (status === 403) {
          setError("No tienes permiso para ver esta orden.");
        } else if (status === 404) {
          setError("Orden no encontrada.");
        } else {
          setError("No se pudo cargar la orden. Intenta de nuevo.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [id]);

  //Callback que recibe la orden actualizada desde OrderActions.
  //Actualiza el estado local para reflejar el nuevo estado sin necesidad de recargar la página (optimistic-like update).
  function handleStatusChanged(updatedOrder: Order) {
    setOrder(updatedOrder);
  }

  //Carga

  if (loading) {
    return (
      <div className="container-page py-10 space-y-8">
        <Skeleton className="h-10 w-64" />
        <Card className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full max-w-sm" />
          ))}
        </Card>
      </div>
    );
  }

  //Estado de error

  if (error || !order) {
    return (
      <div className="container-page py-10 space-y-6">
        <Alert
          variant="danger"
          title="No se pudo cargar la orden"
          message={error ?? "Error desconocido"}
        />
        {/* Botón para volver al listado */}
        <Button variant="secondary" onClick={() => router.push("/orders")}>
          ← Volver a mis órdenes
        </Button>
      </div>
    );
  }

  const isProviderOfOrder =
      Boolean(user?.id) && order.service?.provider?.id === user?.id;

  const actionMode =
      isAdmin()
          ? "admin"
          : isProvider() && isProviderOfOrder
            ? "provider"
            : "client";

  //Detalle de la orden

  return (
    <div className="container-page py-10 space-y-8">
      {/* Encabezado con breadcrumb y badge de estado */}
      <PageHeader
        eyebrow="Mis órdenes"
        title={order.service.title}
        description={`Orden #${order.id.slice(0, 8).toUpperCase()}`}
        action={<OrderStatusBadge status={order.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Panel principal: detalles de la orden */}
        <div className="lg:col-span-2 space-y-6">

          {/* Información del servicio contratado */}
          <Card>
            <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-500">
              Servicio
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-slate-600">Nombre</dt>
                <dd className="text-slate-900 text-right">{order.service.title}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-slate-600">Categoría</dt>
                <dd className="text-slate-900 text-right">{order.service.category}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-slate-600">Proveedor</dt>
                <dd className="text-slate-900 text-right">{order.service.provider.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-slate-600">Descripción</dt>
                <dd className="text-slate-700 text-right max-w-xs">
                  {order.service.description}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Notas de la orden (sólo si existen) */}
          {order.notes && (
            <Card>
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-slate-500">
                Notas
              </h2>
              <p className="text-sm leading-7 text-slate-700">{order.notes}</p>
            </Card>
          )}

          {/* Acciones disponibles para cambiar el estado */}
          <Card>
            <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-500">
              Acciones disponibles
            </h2>
            <OrderActions order={order} onStatusChanged={handleStatusChanged} mode={actionMode}/>
          </Card>
        </div>

        {/* Panel lateral: resumen financiero y metadatos */}
        <aside className="space-y-6">
          <Card>
            <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-500">
              Resumen
            </h2>
            <dl className="space-y-3 text-sm">
              {/* Estado actual con badge */}
              <div className="flex justify-between items-center gap-4">
                <dt className="font-semibold text-slate-600">Estado</dt>
                <dd>
                  <OrderStatusBadge status={order.status} />
                </dd>
              </div>

              {/* Total en COP */}
              <div className="flex justify-between gap-4 border-t border-slate-100 pt-3">
                <dt className="font-black text-slate-900">Total</dt>
                <dd className="font-black text-slate-900 tabular-nums">
                  {formatCurrencyCOP(order.totalAmount)}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Fechas de creación y actualización */}
          <Card>
            <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-500">
              Fechas
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex flex-col gap-1">
                <dt className="font-semibold text-slate-600">Creada</dt>
                <dd className="text-slate-700">{formatDate(order.createdAt)}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="font-semibold text-slate-600">Última actualización</dt>
                <dd className="text-slate-700">{formatDate(order.updatedAt)}</dd>
              </div>
            </dl>
          </Card>

          {/* Botón para volver al listado */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => router.push("/orders")}
          >
            ← Volver a mis órdenes
          </Button>
        </aside>
      </div>
    </div>
  );
}
