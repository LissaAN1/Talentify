'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.name || !formData.email || !formData.password) {
            setError('Por favor completa todos los campos');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (formData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        setIsLoading(true);

        try {
            await authService.register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });

            // Redirigir al login
            router.push('/login?registered=true');
        } catch (err: unknown) {
            const message = isAxiosError(err) ? err.response?.data?.message : undefined;
            setError(Array.isArray(message) ? message.join('. ') : message || 'Error al registrar usuario');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="tf-card w-full max-w-md p-8">
                <div className="text-center">
                    <Link href="/" className="text-3xl font-black tracking-tight text-slate-950">
                        Talent<span className="text-green-600">ify</span>
                    </Link>
                    <h1 className="mt-6 text-xl font-black text-slate-950">Crear cuenta</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Regístrate como cliente para empezar a contratar servicios
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    {error && (
                        <Alert variant="danger" title="Error" message={error} />
                    )}

                    <Input
                        label="Nombre completo"
                        name="name"
                        type="text"
                        placeholder="Juan Pérez"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Correo electrónico"
                        name="email"
                        type="email"
                        placeholder="juan@gmail.com"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email"
                        required
                    />

                    <Input
                        label="Contraseña"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                        required
                    />

                    <Input
                        label="Confirmar contraseña"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        autoComplete="new-password"
                        required
                    />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Registrando...' : 'Registrarse'}
                    </Button>

                    <div className="text-center text-sm">
                        <span className="text-slate-500">¿Ya tienes cuenta? </span>
                        <Link href="/login" className="font-bold text-green-600 hover:underline">
                            Iniciar sesión
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
