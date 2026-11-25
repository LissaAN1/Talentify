// Formulario para crear una nueva orden contratando un servicio del marketplace.
// Si se recibe serviceId como query param, significa que el usuario viene desde
// el detalle de un servicio y el sistema debe seleccionar ese servicio automáticamente.
//
// Si NO se recibe serviceId, el usuario no debe escribir manualmente el UUID.
// En su lugar, selecciona el servicio desde un Select cargado con /services.

"use client";

import { useEffect, useMemo, useState } from "react";
import type { SyntheticEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";

import { ordersService } from "@/services/orders.service";
import { servicesService } from "@/services/services.service";

import { formatCurrencyCOP } from "@/lib/format";

import { ServiceStatus, type Service } from "@/interfaces/service";

export default function NewOrderPage() {
    const router = useRouter();

    const searchParams = useSearchParams();

    const preselectedServiceId = searchParams.get("serviceId") ?? "";

    // Estado del formulario.
    const [serviceId, setServiceId] = useState(preselectedServiceId);
    const [totalAmount, setTotalAmount] = useState("");
    const [notes, setNotes] = useState("");

    // Servicios disponibles para crear una orden manualmente desde /orders/new.
    const [availableServices, setAvailableServices] = useState<Service[]>([]);

    // Servicio seleccionado, ya sea desde query param o desde el Select.
    const [servicePreview, setServicePreview] = useState<Service | null>(null);

    // Estados de carga.
    const [loadingService, setLoadingService] = useState(false);
    const [loadingServices, setLoadingServices] = useState(false);

    // Estados de envío del formulario.
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Servicios activos que el usuario puede contratar.
    const activeServices = useMemo(() => {
        return availableServices.filter((service) => {
            const isActiveByStatus = service.status === ServiceStatus.ACTIVE;
            const isActiveByFlag = service.isActive !== false;

            return isActiveByStatus && isActiveByFlag;
        });
    }, [availableServices]);

    // Opciones del Select de servicios.
    const serviceOptions = useMemo(() => {
        return [
            {
                value: "",
                label: loadingServices
                    ? "Cargando servicios..."
                    : "Selecciona un servicio",
            },
            ...activeServices.map((service) => ({
                value: service.id,
                label: `${service.title}`,
            })),
        ];
    }, [activeServices, loadingServices]);

    // Carga los servicios disponibles para que el usuario pueda seleccionar uno
    // sin tener que conocer ni escribir el ID.
    useEffect(() => {
        let isMounted = true;

        async function loadAvailableServices() {
            setLoadingServices(true);

            try {
                const services = await servicesService.findAll();

                if (!isMounted) return;

                setAvailableServices(services);
            } catch {
                if (!isMounted) return;

                setError("No se pudieron cargar los servicios disponibles.");
            } finally {
                if (isMounted) {
                    setLoadingServices(false);
                }
            }
        }

        loadAvailableServices();

        return () => {
            isMounted = false;
        };
    }, []);

    // Si hay un serviceId en la URL, carga su información para mostrarla
    // en la vista previa y tomar el precio real del servicio.
    useEffect(() => {
        if (!preselectedServiceId) return;

        let isMounted = true;

        async function loadPreselectedService() {
            setLoadingService(true);
            setError(null);

            try {
                const service = await servicesService.findOne(preselectedServiceId);

                if (!isMounted) return;

                setServicePreview(service);
                setServiceId(service.id);

                // El precio SIEMPRE se toma del servicio.
                // El usuario no lo modifica manualmente.
                setTotalAmount(String(service.price));
            } catch {
                if (!isMounted) return;

                setError(
                    "No se pudo precargar el servicio seleccionado. Puedes elegir otro servicio manualmente."
                );

                setServicePreview(null);
                setServiceId("");
                setTotalAmount("");
            } finally {
                if (isMounted) {
                    setLoadingService(false);
                }
            }
        }

        loadPreselectedService();

        return () => {
            isMounted = false;
        };
    }, [preselectedServiceId]);

    // Cuando el usuario selecciona un servicio manualmente, se actualiza
    // la vista previa y el precio se completa automáticamente.
    const handleServiceChange = (event: SyntheticEvent<HTMLSelectElement>) => {
        const selectedServiceId = event.currentTarget.value;

        setServiceId(selectedServiceId);
        setError(null);

        const selectedService = activeServices.find(
            (service) => service.id === selectedServiceId
        );

        if (!selectedService) {
            setServicePreview(null);
            setTotalAmount("");
            return;
        }

        setServicePreview(selectedService);

        // El precio se toma del servicio seleccionado.
        setTotalAmount(String(selectedService.price));
    };

    // Envío del formulario.
    // Valida los campos y llama a ordersService.create.
    // Redirige al detalle de la orden recién creada si tiene éxito.
    async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        // Validación básica antes de llamar a la API.
        if (!serviceId.trim()) {
            setError("Debes seleccionar un servicio.");
            return;
        }

        const amount = Number(totalAmount);

        if (Number.isNaN(amount) || amount < 0) {
            setError("El monto debe ser un número mayor o igual a 0.");
            return;
        }

        // Confirmación antes de crear la orden.
        const confirmed = window.confirm(
            `¿Confirmas crear una orden por ${formatCurrencyCOP(amount)}?`
        );

        if (!confirmed) return;

        setSubmitting(true);

        try {
            const newOrder = await ordersService.create({
                serviceId: serviceId.trim(),
                totalAmount: amount,
                notes: notes.trim() || undefined,
            });

            // Redirige al detalle de la orden recién creada.
            router.push(`/orders/${newOrder.id}`);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string | string[] } } })
                ?.response?.data?.message;

            const text =
                typeof msg === "string"
                    ? msg
                    : Array.isArray(msg)
                      ? msg[0]
                      : "No se pudo crear la orden. Verifica los datos e intenta de nuevo.";

            setError(text);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="container-page py-10 space-y-8">
            <PageHeader
                eyebrow="Órdenes"
                title="Nueva orden"
                description="Completa los datos para contratar un servicio."
            />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Formulario principal */}
                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="lg:col-span-2 space-y-6"
                >
                    <Card className="space-y-5">
                        {/* Error global del formulario */}
                        {error && (
                            <Alert
                                variant="danger"
                                title="Error"
                                message={error}
                            />
                        )}

                        {/* Selección del servicio */}
                        {preselectedServiceId && servicePreview ? (
                            <div className="space-y-4">
                                <Alert
                                    variant="success"
                                    title="Servicio seleccionado automáticamente"
                                    message="No necesitas escribir ni seleccionar el ID del servicio. Talentify lo tomará desde el servicio que elegiste."
                                />

                                <Input
                                    label="Servicio"
                                    name="serviceName"
                                    value={servicePreview.title}
                                    readOnly
                                    helperText="Este servicio fue seleccionado desde el detalle del marketplace."
                                />
                            </div>
                        ) : (
                            <Select
                                label="Servicio"
                                name="serviceId"
                                value={serviceId}
                                onChange={handleServiceChange}
                                disabled={loadingServices || submitting}
                                helperText="Selecciona el servicio que quieres contratar. El precio se completará automáticamente."
                                options={serviceOptions}
                                required
                            />
                        )}

                        {/* Monto total.
                            Este campo es de solo lectura porque el precio se toma
                            directamente del servicio seleccionado. */}
                        <Input
                            label="Monto total (COP)"
                            name="totalAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Selecciona un servicio"
                            value={totalAmount}
                            readOnly
                            helperText={
                                serviceId
                                    ? "El monto se toma del precio del servicio seleccionado."
                                    : "Selecciona un servicio para completar el monto automáticamente."
                            }
                            required
                        />

                        {/* Notas opcionales */}
                        <div>
                            <label
                                htmlFor="notes"
                                className="mb-2 block text-sm font-bold text-slate-800"
                            >
                                Notas (opcional)
                            </label>

                            <textarea
                                id="notes"
                                name="notes"
                                rows={3}
                                placeholder="Instrucciones especiales o detalles del pedido…"
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:tf-focus resize-none"
                            />
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={submitting || loadingService || loadingServices}
                                className="flex-1"
                            >
                                {submitting ? "Creando orden…" : "Crear orden"}
                            </Button>

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => router.push("/orders")}
                                disabled={submitting}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </Card>
                </form>

                {/* Panel lateral: vista previa del servicio */}
                <aside>
                    <Card>
                        <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-500">
                            Servicio seleccionado
                        </h2>

                        {/* Carga del servicio */}
                        {(loadingService || loadingServices) && (
                            <div className="space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        )}

                        {/* Vista previa del servicio */}
                        {servicePreview && !loadingService && (
                            <dl className="space-y-2 text-sm">
                                <div>
                                    <dt className="font-semibold text-slate-600">
                                        Servicio
                                    </dt>
                                    <dd className="text-slate-900">
                                        {servicePreview.title}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="font-semibold text-slate-600">
                                        Proveedor
                                    </dt>
                                    <dd className="text-slate-700">
                                        {servicePreview.provider?.name ??
                                            "Proveedor Talentify"}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="font-semibold text-slate-600">
                                        Precio base
                                    </dt>
                                    <dd className="font-black text-slate-900">
                                        {formatCurrencyCOP(servicePreview.price)}
                                    </dd>
                                </div>
                            </dl>
                        )}

                        {/* Mensaje si todavía no se ha seleccionado ningún servicio */}
                        {!servicePreview && !loadingService && !loadingServices && (
                            <p className="text-sm text-slate-500">
                                Selecciona un servicio para ver su detalle y crear la orden.
                            </p>
                        )}
                    </Card>
                </aside>
            </div>
        </div>
    );
}
