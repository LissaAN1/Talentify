"use client";

import { useState } from "react";
import type { SyntheticEvent } from "react";

import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

import { CreateUserDto, UpdateUserDto, User } from "@/interfaces/user";
import { AppRoles, roleLabels, roleOptions } from "@/constants/app-roles";

type UserFormMode = "create" | "edit" | "profile";

type UserFormValues = {
    name: string;
    email: string;
    password: string;
    roles: AppRoles[];
};

type UserFormSubmitValues = CreateUserDto | (UpdateUserDto & { roles?: AppRoles[] });

type UserFormProps = {
    mode: UserFormMode;
    submitLabel: string;
    initialUser?: Partial<User>;
    onSubmit: (values: UserFormSubmitValues) => Promise<void>;
    onCancelHref?: string;
};

// Define los valores iniciales del formulario según el usuario recibido:
function getInitialValues(initialUser?: Partial<User>): UserFormValues {
    return {
        name: initialUser?.name ?? "",
        email: initialUser?.email ?? "",
        password: "",
        roles: initialUser?.roles?.length ? initialUser.roles : [AppRoles.CLIENT],
    };
}

export function UserForm({
    mode,
    submitLabel,
    initialUser,
    onSubmit,
    onCancelHref = "/users",
}: UserFormProps) {
    const [values, setValues] = useState<UserFormValues>(() => getInitialValues(initialUser));
    const [errors, setErrors] = useState<Partial<Record<keyof UserFormValues, string>>>({});
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);

    // El correo solo se puede definir al crear un usuario!!
    const canEditEmail = mode === "create";

    // Los roles no se editan desde el formulario de perfil.
    const canEditRoles = mode !== "profile";

    // Agrega o quita roles sin permitir que el usuario quede sin roles asignados.
    const toggleRole = (role: AppRoles) => {
        setValues((current) => {
            const hasRole = current.roles.includes(role);

            if (hasRole && current.roles.length === 1) {
                return current;
            }

            return {
                ...current,
                roles: hasRole
                    ? current.roles.filter((item) => item !== role)
                    : [...current.roles, role],
            };
        });
    };

    const validate = () => {
        const nextErrors: Partial<Record<keyof UserFormValues, string>> = {};

        if (!values.name.trim()) {
            nextErrors.name = "El nombre es obligatorio.";
        }

        if (mode === "create" && !values.email.trim()) {
            nextErrors.email = "El correo es obligatorio.";
        }

        if (mode === "create" && !values.password.trim()) {
            nextErrors.password = "La contraseña es obligatoria.";
        }

        if (canEditRoles && values.roles.length === 0) {
            nextErrors.roles = "Debe asignar al menos un rol.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    // Construye el payload según el modo del formulario:
    const buildPayload = (): UserFormSubmitValues => {
        if (mode === "create") {
            return {
                name: values.name.trim(),
                email: values.email.trim(),
                password: values.password,
                roles: values.roles,
            };
        }

        const payload: UpdateUserDto & { roles?: AppRoles[] } = {
            name: values.name.trim(),
        };

        if (values.password.trim()) {
            payload.password = values.password;
        }

        if (canEditRoles) {
            payload.roles = values.roles;
        }

        return payload;
    };

    const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError("");

        if (!validate()) return;

        setLoading(true);

        try {
            await onSubmit(buildPayload());
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : "No se pudo guardar la información del usuario.";

            setFormError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            {formError && (
                <Alert
                    className="mb-6"
                    variant="danger"
                    title="No se pudo guardar"
                    message={formError}
                />
            )}

            <form onSubmit={handleSubmit} className="grid gap-5">
                <Input
                    label="Nombre"
                    value={values.name}
                    onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
                    error={errors.name}
                    placeholder="Ej: Juan Pérez"
                    autoComplete="name"
                />

                <Input
                    label="Correo"
                    type="email"
                    value={values.email}
                    onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
                    error={errors.email}
                    placeholder="usuario@u.icesi.edu.co"
                    disabled={!canEditEmail}
                    helperText={
                        canEditEmail
                            ? "Usa un correo válido que no esté registrado."
                            : "El correo no puede modificarse desde este formulario."
                    }
                    autoComplete="email"
                />

                <Input
                    label={mode === "create" ? "Contraseña" : "Nueva contraseña"}
                    type="password"
                    value={values.password}
                    onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
                    error={errors.password}
                    placeholder={mode === "create" ? "Ingresa una contraseña segura" : "Dejar vacío para conservar la contraseña actual"}
                    helperText="Usa una contraseña que cumpla los requisitos de seguridad."
                    autoComplete="new-password"
                />

                {canEditRoles && (
                    <section>
                        <p className="mb-2 block text-sm font-bold text-slate-800">Roles</p>

                        <div className="flex flex-wrap gap-2">
                            {roleOptions.map((role) => {
                                const active = values.roles.includes(role.value);

                                return (
                                    <button
                                        key={role.value}
                                        type="button"
                                        onClick={() => toggleRole(role.value)}
                                        className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                                            active
                                                ? "border-green-600 bg-green-600 text-white"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                                        }`}
                                    >
                                        {roleLabels[role.value]}
                                    </button>
                                );
                            })}
                        </div>

                        {errors.roles && (
                            <p className="mt-2 text-xs font-medium text-red-600">
                                {errors.roles}
                            </p>
                        )}
                    </section>
                )}

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                    <Button href={onCancelHref} variant="secondary">
                        Cancelar
                    </Button>

                    <Button type="submit" disabled={loading}>
                        {loading ? "Guardando..." : submitLabel}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
