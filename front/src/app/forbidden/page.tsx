'use client';

import { Button } from '@/components/ui/Button';
import { ShieldX } from 'lucide-react';

export default function ForbiddenPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="tf-card w-full max-w-md p-8 text-center">
                <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <ShieldX className="h-8 w-8 text-red-600" />
                    </div>
                </div>

                <h1 className="mt-6 text-2xl font-black text-slate-950">Acceso denegado</h1>
                <p className="mt-2 text-slate-600">
                    No tienes permisos suficientes para acceder a esta página.
                </p>

                <div className="mt-8 flex gap-4 justify-center">
                    <Button href="/dashboard">Ir al dashboard</Button>
                    <Button href="/" variant="secondary">Volver al inicio</Button>
                </div>
            </div>
        </div>
    );
}
