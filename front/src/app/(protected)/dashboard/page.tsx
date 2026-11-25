"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, ClipboardList, DollarSign, Users } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/dashboard/StatCard";

import { usersService } from "@/services/users.service";
import { servicesService } from "@/services/services.service";
import { ordersService } from "@/services/orders.service";

import { OrderStatus } from "@/interfaces/order";
import type { Order } from "@/interfaces/order";
import type { Service } from "@/interfaces/service";
import type { User } from "@/interfaces/user";
import { formatCurrencyCOP } from "@/lib/format";

export default function DashboardPage() {
    const { isAdmin, isProvider } = useAuth();

    const userIsAdmin = isAdmin();
    const userIsProvider = isProvider();

    const [orders, setOrders] = useState<Order[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [myServices, setMyServices] = useState<Service[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadDashboardData() {
            setLoading(true);
            setError("");

            try {
                const requests: Promise<unknown>[] = [
                    ordersService.getAll().then(setOrders),
                ];

                if (userIsAdmin) {
                    requests.push(servicesService.findAll().then(setServices));
                    requests.push(usersService.findAll().then(setUsers));
                }

                if (userIsProvider || userIsAdmin) {
                    requests.push(servicesService.findMyServices().then(setMyServices));
                }

                await Promise.all(requests);
            } catch {
                setError("No pudimos cargar toda la información del panel. Intenta actualizar la página.");
            } finally {
                setLoading(false);
            }
        }

        loadDashboardData();
    }, [userIsAdmin, userIsProvider]);

    const openOrders = useMemo(
        () =>
            orders.filter(
                (order) =>
                    order.status !== OrderStatus.COMPLETED &&
                    order.status !== OrderStatus.CANCELLED
            ),
        [orders]
    );

    const completedOrders = useMemo(
        () => orders.filter((order) => order.status === OrderStatus.COMPLETED),
        [orders]
    );

    const ownRevenue = useMemo(
        () =>
            completedOrders.reduce(
                (total, order) => total + Number(order.totalAmount ?? 0),
                0
            ),
        [completedOrders]
    );

    return (
        <div className="space-y-8">
            {error && <Alert variant="warning" title="Panel incompleto" message={error} />}

            {loading ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {userIsAdmin && (
                        <StatCard
                            title="Servicios activos"
                            value={String(services.length)}
                            icon={BriefcaseBusiness}
                            tone="green"
                        />
                    )}

                    <StatCard
                        title="Órdenes abiertas"
                        value={String(openOrders.length)}
                        icon={ClipboardList}
                        tone="blue"
                    />

                    {userIsAdmin && (
                        <StatCard
                            title="Usuarios"
                            value={String(users.length)}
                            icon={Users}
                            tone="slate"
                        />
                    )}

                    {(userIsProvider || userIsAdmin) && (
                        <StatCard
                            title="Mis servicios"
                            value={String(myServices.length)}
                            icon={BriefcaseBusiness}
                            tone="green"
                        />
                    )}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-black text-slate-950">
                        Acciones rápidas
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Atajos para acceder rápidamente a las funciones principales de Talentify.
                    </p>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <Button href="/marketplace" variant="secondary">
                            Explorar marketplace
                        </Button>

                        <Button href="/orders" variant="secondary">
                            Ver órdenes
                        </Button>

                        {(userIsProvider || userIsAdmin) && (
                            <Button href="/services/new">
                                Publicar servicio
                            </Button>
                        )}

                        {userIsAdmin && (
                            <Button href="/users" variant="secondary">
                                Administrar usuarios
                            </Button>
                        )}
                    </div>
                </Card>

                <Card>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                        <DollarSign className="h-6 w-6" />
                    </div>

                    <h2 className="mt-5 text-xl font-black text-slate-950">
                        Resumen de actividad
                    </h2>

                    <p className="mt-2 leading-7 text-slate-600">
                        Consulta un resumen de tu actividad, incluyendo órdenes, servicios y usuarios disponibles según tu rol.
                    </p>

                    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm font-bold text-slate-500">
                            Ingresos por órdenes completadas
                        </p>
                        <p className="mt-1 text-2xl font-black text-slate-950">
                            {formatCurrencyCOP(ownRevenue)}
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
