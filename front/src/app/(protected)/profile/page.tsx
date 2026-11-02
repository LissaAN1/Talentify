"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { Alert } from "@/components/ui/Alert";

import { PageHeader } from "@/components/shared/PageHeader";
import { UserForm } from "@/components/users/UserForm";

import { UpdateUserDto, User } from "@/interfaces/user";
import { usersService } from "@/services/users.service";

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [profileSuccess, setProfileSuccess] = useState("");
    const [profileError, setProfileError] = useState("");

    // La carga inicial no llama a setState de forma síncrona dentro del efecto:
    // los estados cambian solo cuando responde la petición.
    useEffect(() => {
        let activo = true;

        usersService
            .getMe()
            .then((data) => {
                if (activo) setUser(data);
            })
            .catch(() => {
                if (activo) {
                    setProfileError(
                        "No se pudo cargar el perfil. Inicia sesión de nuevo e inténtalo otra vez."
                    );
                }
            })
            .finally(() => {
                if (activo) setLoading(false);
            });

        return () => {
            activo = false;
        };
    }, []);

    const handleProfileSubmit = async (values: UpdateUserDto) => {
        setProfileSuccess("");
        setProfileError("");

        try {
            const updatedUser = await usersService.updateMe(values);
            setUser(updatedUser);
            setProfileSuccess("Perfil actualizado correctamente.");
        } catch (err: unknown) {
            const message = axios.isAxiosError(err)
                ? err.response?.data?.message
                : undefined;

            setProfileError(
                Array.isArray(message)
                    ? message.join(". ")
                    : message || "No se pudo actualizar el perfil."
            );
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                eyebrow="Perfil"
                title="Mi perfil"
                description="Actualiza tu información personal y configura la seguridad de tu cuenta."
            />

            {profileSuccess && (
                <Alert
                    variant="success"
                    title="Actualización exitosa"
                    message={profileSuccess}
                />
            )}

            {profileError && (
                <Alert
                    variant="warning"
                    title="Perfil no disponible"
                    message={profileError}
                />
            )}

            {loading ? (
                <p className="text-sm font-semibold text-slate-600">
                    Cargando perfil...
                </p>
            ) : user ? (
                <UserForm
                    mode="profile"
                    submitLabel="Guardar mi perfil"
                    initialUser={user}
                    onSubmit={(values) => handleProfileSubmit(values as UpdateUserDto)}
                    onCancelHref="/dashboard"
                />
            ) : null}

        </div>
    );
}
