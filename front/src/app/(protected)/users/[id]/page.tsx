"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LucideIcon, Mail, Shield, ToggleLeft } from "lucide-react";

import { formatDate } from "@/lib/format";

import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

import { PageHeader } from "@/components/shared/PageHeader";
import { UserRoleBadges } from "@/components/users/UserRoleBadges";
import { UserStatusBadge } from "@/components/users/UserStatusBadge";

import { User } from "@/interfaces/user";
import { usersService } from "@/services/users.service";

export default function UserDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();

    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [deactivating, setDeactivating] = useState(false);

    useEffect(() => {
        usersService
            .findOne(params.id)
            .then(setUser)
            .catch(() => setError("No fue posible cargar la información del usuario."))
            .finally(() => setLoading(false));
    }, [params.id]);

    const handleDeactivate = async () => {
        if (!confirm("¿Seguro que deseas desactivar este usuario?")) return;

        setDeactivating(true);

        try {
            await usersService.delete(params.id); // Soft-delete!
            router.push("/users");
        } catch {
            setError("No fue posible desactivar el usuario.");
        } finally {
            setDeactivating(false);
        }
    };

    if (loading) {
        return (
            <p className="text-sm font-semibold text-slate-600">
                Cargando usuario...
            </p>
        );
    }

    if (!user) {
        return (
            <EmptyUserResult error={error || "No se encontró información para este usuario."} />
        );
    }

    return (
        <div className="space-y-8">
            <PageHeader
                eyebrow="Detalle de usuario"
                title={user.name}
                description="Consulta la información registrada para este usuario."
                action={
                    <div className="flex flex-wrap gap-2">
                        <Button href={`/users/${user.id}/edit`} variant="secondary">
                            Editar
                        </Button>

                        <Button
                            variant="danger"
                            onClick={handleDeactivate}
                            disabled={deactivating}
                        >
                            {deactivating ? "Desactivando..." : "Desactivar"}
                        </Button>
                    </div>
                }
            />

            {error && (
                <Alert
                    variant="danger"
                    title="No se pudo completar la acción"
                    message={error}
                />
            )}

            <Card>
                <div className="flex flex-wrap items-center gap-3">
                    <UserStatusBadge isActive={user.isActive} />
                    <UserRoleBadges roles={user.roles} />
                </div>

                <div className="mt-8 grid gap-5 md:grid-cols-2">
                    <InfoItem icon={Mail} label="Correo" value={user.email} />
                    <InfoItem
                        icon={Shield}
                        label="Autenticación en dos pasos"
                        value={user.isTwoFactorEnabled ? "Activada" : "No activada"}
                    />
                    <InfoItem
                        icon={ToggleLeft}
                        label="Fecha de creación"
                        value={formatDate(user.createdAt)}
                    />
                    <InfoItem
                        icon={ToggleLeft}
                        label="Última actualización"
                        value={formatDate(user.updatedAt)}
                    />
                </div>
            </Card>

            <Button href="/users" className="w-fit">
                Volver a usuarios
            </Button>
        </div>
    );
}

function InfoItem({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-green-700" />
                <p className="text-sm font-black text-slate-950">{label}</p>
            </div>

            <p className="mt-2 break-words text-sm text-slate-600">
                {value}
            </p>
        </div>
    );
}

function EmptyUserResult({ error }: { error: string }) {
    return (
        <div className="space-y-5">
            <Alert
                variant="warning"
                title="Usuario no disponible"
                message={error}
            />

            <Button href="/users" variant="secondary">
                Volver a usuarios
            </Button>
        </div>
    );
}
