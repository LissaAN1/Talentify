"use client";

import { FormEvent, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { PageHeader } from "@/components/shared/PageHeader";
import { UserForm } from "@/components/users/UserForm";

import { UpdateUserDto, User } from "@/interfaces/user";
import { usersService } from "@/services/users.service";
import { useTwoFactorAuth } from "@/hooks/useTwoFactorAuth";
import { useUserStore } from "@/providers/user-store-provider";

export default function ProfilePage() {
    const storeToken = useUserStore((state) => state.token);
    const setStoreUser = useUserStore((state) => state.setUser);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [profileSuccess, setProfileSuccess] = useState("");
    const [profileError, setProfileError] = useState("");

    const { qrCode, isLoading, generateQR, enable2FA } = useTwoFactorAuth();
    const [code, setCode] = useState("");
    const [securitySuccess, setSecuritySuccess] = useState("");
    const [securityError, setSecurityError] = useState("");

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

            // Mantiene sincronizados el menú lateral y la cookie de sesión con el nombre nuevo.
            Cookies.set("currentUser", JSON.stringify({
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                roles: updatedUser.roles,
            }), { expires: 7 });
            setStoreUser({
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                roles: updatedUser.roles,
                token: storeToken,
            });
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

    const apiMessage = (err: unknown, fallback: string) => {
        const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
        return Array.isArray(message) ? message.join(". ") : message || fallback;
    };

    const handleGenerateQR = async () => {
        setSecurityError("");
        setSecuritySuccess("");

        try {
            await generateQR();
        } catch (err: unknown) {
            setSecurityError(apiMessage(err, "No se pudo generar el código QR."));
        }
    };

    const handleEnable2FA = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSecurityError("");
        setSecuritySuccess("");

        if (code.length !== 6) {
            setSecurityError("El código debe tener exactamente 6 dígitos.");
            return;
        }

        try {
            const response = await enable2FA(code);
            setSecuritySuccess(response.mensaje || "2FA habilitado correctamente.");
            setCode("");
        } catch (err: unknown) {
            setSecurityError(apiMessage(err, "Código 2FA inválido."));
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

            <div>
                <h2 className="text-2xl font-black text-slate-950">Seguridad</h2>
                <p className="mt-2 text-sm text-slate-600">
                    Configura opciones adicionales para proteger tu cuenta.
                </p>
            </div>

            <section className="tf-card p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100">
                        <ShieldCheck className="h-6 w-6 text-green-700" />
                    </div>

                    <div className="flex-1">
                        <h2 className="text-xl font-black text-slate-950">Autenticación de doble factor</h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Escanea el código QR con Google Authenticator, Microsoft Authenticator, Authy o una
                            aplicación similar. Luego escribe el código de 6 dígitos para activar la protección adicional.
                        </p>

                        <div className="mt-6">
                            <Button type="button" onClick={handleGenerateQR} disabled={isLoading}>
                                {isLoading ? "Generando..." : "Generar código QR"}
                            </Button>
                        </div>

                        {securityError && (
                            <div className="mt-4">
                                <Alert variant="danger" title="Error" message={securityError} />
                            </div>
                        )}

                        {securitySuccess && (
                            <div className="mt-4">
                                <Alert variant="success" title="Listo" message={securitySuccess} />
                            </div>
                        )}

                        {qrCode && (
                            <div className="mt-6 space-y-6">
                                <div className="inline-block rounded-2xl border border-slate-200 bg-white p-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={qrCode} alt="Código QR para activar 2FA" className="h-56 w-56" />
                                </div>

                                <form onSubmit={handleEnable2FA} className="max-w-sm space-y-4">
                                    <Input
                                        label="Código de autenticación"
                                        name="token"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="123456"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                        required
                                    />

                                    <Button type="submit" disabled={isLoading || code.length !== 6}>
                                        {isLoading ? "Verificando..." : "Activar 2FA"}
                                    </Button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
