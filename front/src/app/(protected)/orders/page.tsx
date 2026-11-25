// Página de listado de órdenes del usuario autenticado.
// Muestra las órdenes creadas por el usuario y, si aplica, las órdenes recibidas como proveedor.

"use client";

import { useEffect, useState } from "react";
import { isAxiosError } from "axios";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

import { useAuth } from "@/hooks/useAuth";
import { ordersService } from "@/services/orders.service";
import type { Order } from "@/interfaces/order";
import { formatCurrencyCOP, formatDate } from "@/lib/format";

type OrdersSectionProps = {
  title: string;
  description: string;
  orders: Order[];
  emptyTitle: string;
  emptyDescription: string;
  showClient?: boolean;
};

// Sección reutilizable para mostrar un grupo de órdenes.
// Permite usar la misma estructura tanto para pedidos propios como para trabajos recibidos.
function OrdersSection({
  title,
  description,
  orders,
  emptyTitle,
  emptyDescription,
  showClient = false,
}: OrdersSectionProps) {
  return (
    <Card>
      {/* Encabezado interno de la sección */}
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>

        {/* Contador de órdenes de la sección */}
        <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-black text-green-700">
          {orders.length} orden{orders.length === 1 ? "" : "es"}
        </span>
      </div>

      {/* Lista vacía de la sección */}
      {orders.length === 0 ? (
        <div className="pt-6">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
          {/* Encabezado de la tabla visual */}
          <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
            <div className="col-span-4">Servicio</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-3">{showClient ? "Cliente" : "Fecha"}</div>
            <div className="col-span-1 text-right">Ver</div>
          </div>

          {/* Listado de órdenes */}
          {orders.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-12 items-center border-t border-slate-100 px-4 py-4 text-sm"
            >
              {/* Nombre del servicio contratado */}
              <div className="col-span-4">
                <p className="font-black text-slate-950">
                  {order.service?.title ?? "Servicio sin título"}
                </p>

                <p className="mt-1 truncate text-xs text-slate-500">
                  #{order.id}
                </p>
              </div>

              {/* Badge de estado coloreado */}
              <div className="col-span-2">
                <OrderStatusBadge status={order.status} />
              </div>

              {/* Total en pesos colombianos */}
              <div className="col-span-2 font-bold text-slate-700">
                {formatCurrencyCOP(order.totalAmount)}
              </div>

              {/* Fecha de creación o cliente, según la sección */}
              <div className="col-span-3 text-slate-600">
                {showClient
                  ? order.user?.name ?? order.user?.email ?? "Cliente"
                  : formatDate(order.createdAt)}
              </div>

              {/* Enlace al detalle de la orden */}
              <div className="col-span-1 text-right">
                <Button href={`/orders/${order.id}`} size="sm" variant="secondary">
                  Ver
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function OrdersPage() {
  // Consulta de permisos del usuario autenticado.
  const { isProvider, isAdmin } = useAuth();

  // Lista de órdenes creadas por el usuario autenticado.
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  // Lista de órdenes recibidas por servicios publicados por el proveedor.
  const [providerOrders, setProviderOrders] = useState<Order[]>([]);

  // true mientras se espera la respuesta de la API.
  const [loading, setLoading] = useState(true);

  // Mensaje de error si alguna petición falla.
  const [error, setError] = useState<string | null>(null);

  // Determina si el usuario puede consultar trabajos recibidos.
  const canSeeProviderOrders = isProvider() || isAdmin();

  // Carga las órdenes al montar el componente o cuando cambian los permisos del usuario.
  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        setError(null);

        // Carga las órdenes creadas por el usuario autenticado.
        const ownOrders = await ordersService.getAll();
        setMyOrders(ownOrders);

        // Si el usuario es proveedor o administrador, también carga los trabajos recibidos.
        if (canSeeProviderOrders) {
          const receivedOrders = await ordersService.getProviderOrders();
          setProviderOrders(receivedOrders);
        }
      } catch (err: unknown) {
        const message = isAxiosError(err) ? err.response?.data?.message : undefined;
        setError(message ?? "No pudimos cargar las órdenes. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [canSeeProviderOrders]);

  return (
    <div className="container-page py-10 space-y-8">
      {/* Encabezado con título y acción principal */}
      <PageHeader
        eyebrow="Órdenes"
        title="Órdenes"
        description="Consulta el estado de tus pedidos y, si eres proveedor, los trabajos que has recibido."
        action={
          <Button href="/marketplace" variant="primary">
            Explorar marketplace
          </Button>
        }
      />

      {/* Estado de error */}
      {error && (
        <Alert variant="danger" title="Error al cargar órdenes" message={error} />
      )}

      {/* Carga */}
      {loading && (
        <Card>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20 ml-auto" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Contenido de órdenes */}
      {!loading && (
        <>
          {/* Órdenes creadas por el usuario autenticado */}
          <OrdersSection
            title="Mis pedidos"
            description="Órdenes que has creado al contratar servicios en Talentify."
            orders={myOrders}
            emptyTitle="Aún no tienes pedidos"
            emptyDescription="Cuando contrates un servicio desde el marketplace, aparecerá en esta sección."
          />

          {/* Órdenes recibidas por el usuario proveedor o administrador */}
          {canSeeProviderOrders && (
            <OrdersSection
              title="Trabajos recibidos"
              description="Órdenes asociadas a servicios publicados por ti como proveedor."
              orders={providerOrders}
              emptyTitle="Aún no tienes trabajos recibidos"
              emptyDescription="Cuando un cliente contrate uno de tus servicios, la orden aparecerá aquí."
              showClient
            />
          )}

          {/* Tip para proveedores sin trabajos recibidos */}
          {canSeeProviderOrders && providerOrders.length === 0 && (
            <Alert
              variant="success"
              title="Tip para proveedores"
              message="Publica servicios claros y completos para aumentar la probabilidad de recibir órdenes."
            />
          )}
        </>
      )}
    </div>
  );
}
