import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <section className="tf-card max-w-xl p-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-700">404</p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">Página no disponible</h1>
            <p className="mt-3 text-slate-600">
                La página solicitada no está disponible. Verifica la dirección o vuelve al inicio para continuar navegando.
            </p>
            <div className="mt-6 flex justify-center">
            <Button href="/">Volver al inicio</Button>
            </div>
        </section>
        </main>
    );
}
