'use client';

import { useState } from 'react';
import { Suspense } from "react";
import { isAxiosError } from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/dashboard';
    
    const { login, verify2FA, isLoading } = useAuth();
    
    const [step, setStep] = useState<'login' | '2fa'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [partialToken, setPartialToken] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!email || !password) {
            setError('Por favor ingresa tu correo y contraseña');
            return;
        }
        
        try {
            const result = await login(email, password);
            
            if (result.requires2FA && result.partialToken) {
                setPartialToken(result.partialToken);
                setStep('2fa');
            } else if (result.success) {
                router.push(redirect);
            }
        } catch (err: unknown) {
            const message = isAxiosError(err) ? err.response?.data?.message : undefined;
            setError(Array.isArray(message) ? message.join('. ') : message || 'Credenciales inválidas');
        }
    };

    const handleVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!twoFactorCode || twoFactorCode.length !== 6) {
            setError('Por favor ingresa el código de 6 dígitos');
            return;
        }
        
        try {
            const success = await verify2FA(twoFactorCode, partialToken);
            if (success) {
                router.push(redirect);
            }
        } catch (err: unknown) {
            const message = isAxiosError(err) ? err.response?.data?.message : undefined;
            setError(Array.isArray(message) ? message.join('. ') : message || 'Código inválido');
        }
    };

    if (step === '2fa') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="tf-card w-full max-w-md p-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-black text-slate-950">Autenticación de dos factores</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Ingresa el código de 6 dígitos generado por tu aplicación de autenticación
                        </p>
                    </div>

                    <form onSubmit={handleVerify2FA} className="mt-8 space-y-6">
                        {error && (
                            <Alert variant="danger" title="Error" message={error} />
                        )}

                        <Input
                            label="Código 2FA"
                            type="text"
                            placeholder="123456"
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value)}
                            maxLength={6}
                            autoFocus
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Verificando...' : 'Verificar'}
                        </Button>

                        <button
                            type="button"
                            onClick={() => setStep('login')}
                            className="w-full text-center text-sm text-green-600 hover:underline"
                        >
                            Volver al inicio de sesión
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="tf-card w-full max-w-md p-8">
                <div className="text-center">
                    <Link href="/" className="text-3xl font-black tracking-tight text-slate-950">
                        Talent<span className="text-green-600">ify</span>
                    </Link>
                    <h1 className="mt-6 text-xl font-black text-slate-950">Iniciar sesión</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Ingresa tus credenciales para continuar
                    </p>
                </div>

                <form onSubmit={handleLogin} className="mt-8 space-y-6">
                    {error && (
                        <Alert variant="danger" title="Error" message={error} />
                    )}

                    <Input
                        label="Correo electrónico"
                        type="email"
                        placeholder="admin@u.icesi.edu.co"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />

                    <Input
                        label="Contraseña"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                    </Button>

                    <div className="text-center text-sm">
                        <span className="text-slate-500">¿No tienes cuenta? </span>
                        <Link href="/register" className="font-bold text-green-600 hover:underline">
                            Regístrate
                        </Link>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                        <p className="text-center text-xs text-slate-400">
                            Usuarios de prueba:<br />
                            admin@u.icesi.edu.co / Admin12345<br />
                            provider@u.icesi.edu.co / Provider12345<br />
                            client@u.icesi.edu.co / Client12345
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <LoginContent />
        </Suspense>
    );
}
