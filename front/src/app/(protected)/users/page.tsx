"use client";

import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

import { UserRoleBadges } from "@/components/users/UserRoleBadges";
import { UserStatusBadge } from "@/components/users/UserStatusBadge";

import { User } from "@/interfaces/user";
import { usersService } from "@/services/users.service";

function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    return "No fue posible cargar los usuarios.";
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [query, setQuery] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        usersService
            .findAll()
            .then(setUsers)
            .catch((error) => setError(getErrorMessage(error)))
            .finally(() => setLoading(false));
    }, []);

    const filteredUsers = useMemo(() => {
        const normalizedQuery = query.toLowerCase().trim();

        if (!normalizedQuery) return users;

        return users.filter((user) =>
            `${user.name} ${user.email} ${user.roles.join(" ")}`
                .toLowerCase()
                .includes(normalizedQuery)
        );
    }, [query, users]);

    return (
        <div className="space-y-8">
            <PageHeader
                eyebrow="Administración"
                title="Usuarios"
                description="Gestiona los usuarios registrados en la plataforma."
                action={
                    <Button href="/users/new">
                        <Plus className="h-4 w-4" />
                        Nuevo usuario
                    </Button>
                }
            />

            {error && (
                <Alert
                    variant="warning"
                    title="No se pudieron cargar los usuarios"
                    message="No fue posible obtener la información en este momento. Intenta nuevamente o contacta al administrador."
                />
            )}

            <section className="tf-card p-5">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:tf-focus"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Buscar por nombre, correo o rol..."
                    />
                </div>
            </section>

            {loading ? (
                <p className="text-sm font-semibold text-slate-600">Cargando usuarios...</p>
            ) : filteredUsers.length === 0 ? (
                <EmptyState
                    title="No hay usuarios disponibles"
                    description="Aún no se han registrado usuarios en la plataforma."
                    action={<Button href="/users/new">Crear usuario</Button>}
                />
            ) : (
                <div className="grid gap-4">
                    {filteredUsers.map((user) => (
                        <Card key={user.id} className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h2 className="text-lg font-black text-slate-950">{user.name}</h2>
                                    <UserStatusBadge isActive={user.isActive} />
                                </div>

                                <p className="mt-1 text-sm text-slate-600">{user.email}</p>

                                <div className="mt-3">
                                    <UserRoleBadges roles={user.roles} />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button href={`/users/${user.id}`} variant="secondary" size="sm">
                                    Ver
                                </Button>
                                <Button href={`/users/${user.id}/edit`} variant="secondary" size="sm">
                                    Editar
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
