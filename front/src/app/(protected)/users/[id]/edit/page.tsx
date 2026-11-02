"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Alert } from "@/components/ui/Alert";
import { UserForm } from "@/components/users/UserForm";
import { PageHeader } from "@/components/shared/PageHeader";

import { AppRoles } from "@/constants/app-roles";
import { UpdateUserDto, User } from "@/interfaces/user";
import { usersService } from "@/services/users.service";

type EditUserSubmitValues = UpdateUserDto & { roles?: AppRoles[] };

export default function EditUserPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        usersService
            .findOne(params.id)
            .then(setUser)
            .catch(() => setError("No fue posible cargar la información del usuario."))
            .finally(() => setLoading(false));
    }, [params.id]);

    const handleSubmit = async (values: EditUserSubmitValues) => {
        const { roles, ...profileValues } = values;

        await usersService.update(params.id, profileValues);

        if (roles) {
            await usersService.updateRoles(params.id, { roles });
        }

        router.push(`/users/${params.id}`);
    };

    if (loading) {
        return (
            <p className="text-sm font-semibold text-slate-600">
                Cargando información del usuario...
            </p>
        );
    }

    if (!user) {
        return (
            <Alert
                variant="warning"
                title="Usuario no disponible"
                message={error || "No se encontró información para este usuario."}
            />
        );
    }

    return (
        <div className="space-y-8">
            <PageHeader
                eyebrow="Usuarios"
                title="Editar usuario"
                description="Actualiza la información básica del usuario y sus roles."
            />

            {error && (
                <Alert
                    variant="warning"
                    title="No se pudo cargar el usuario"
                    message={error}
                />
            )}

            <UserForm
                mode="edit"
                submitLabel="Guardar cambios"
                initialUser={user}
                onSubmit={(values) => handleSubmit(values as EditUserSubmitValues)}
                onCancelHref={`/users/${params.id}`}
            />
        </div>
    );
}
