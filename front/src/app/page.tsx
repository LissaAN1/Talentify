import Link from "next/link";

import {
    ArrowRight, CheckCircle2, Code2, Megaphone, Palette,
    Search, ShieldCheck, Star, Users, Video,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { CategoryCard } from "@/components/marketplace/CategoryCard";

const categories = [
    { title: "Programación", description: "Apps, APIs, scripts y soporte técnico", icon: Code2 },
    { title: "Diseño", description: "Logos, piezas gráficas y presentaciones", icon: Palette },
    { title: "Marketing", description: "Contenido, redes y estrategia digital", icon: Megaphone },
    { title: "Video", description: "Edición, reels y animaciones simples", icon: Video },
];

export default function Home() {
    return (
        <main>
            <nav className="border-b border-slate-200 bg-white/90 backdrop-blur">
                <div className="container-page flex h-20 items-center justify-between">
                    <Link href="/" className="text-3xl font-black tracking-tight text-slate-950">
                        Talent<span className="text-green-600">ify</span>
                    </Link>

                    <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
                        <Link href="#categorias" className="hover:text-green-700">Categorías</Link>
                        <Button href="/register" size="sm" variant="secondary">Crear cuenta</Button>
                        <Button href="/login" size="sm">Iniciar sesión</Button>
                    </div>
                </div>
            </nav>

            <section className="container-page py-10 md:py-14">
                <div className="overflow-hidden rounded-[2rem] bg-[#052e16] px-6 py-14 text-center text-white shadow-2xl md:px-12 md:py-20">
                    <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-green-100 ring-1 ring-white/15">

                    <Star className="h-4 w-4" />
                    Marketplace universitario de microservicios
                    </p>

                    <h1 className="mx-auto max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                    ¡Encuentra talento estudiantil confiable para resolver tareas reales!
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-green-50 md:text-lg">
                    Publica servicios, contrata compañeros, gestiona órdenes y conserva trazabilidad dentro de una experiencia clara, segura y profesional.
                    </p>

                    <form className="mx-auto mt-9 flex max-w-3xl flex-col overflow-hidden rounded-2xl bg-white p-2 shadow-xl md:flex-row">
                    
                    <div className="flex flex-1 items-center gap-3 px-4">
                        <Search className="h-5 w-5 text-slate-400" />
                        <input
                            className="h-12 flex-1 border-0 text-slate-900 outline-none placeholder:text-slate-400"
                            placeholder="¿Qué servicio buscas? Ej: landing page, logo, edición de video"
                        />
                    </div>

                    <Button href="/login" className="h-12 md:min-w-40">
                        Buscar <ArrowRight className="h-4 w-4" />
                    </Button>
                    </form>

                    <div className="mt-10 grid gap-5 text-left md:grid-cols-3">
                        {[
                        { icon: Users, label: "Talento estudiantil", text: "Encuentra servicios ofrecidos por compañeros de la comunidad universitaria." },
                        { icon: ShieldCheck, label: "Órdenes trazables", text: "Consulta el estado de cada solicitud desde la contratación hasta la entrega." },
                        { icon: CheckCircle2, label: "Experiencia organizada", text: "Centraliza servicios, solicitudes y pagos en un solo lugar." },
                        ].map((item) => (
                        <div key={item.label} className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15">
                            <item.icon className="h-6 w-6 text-green-300" />
                            <p className="mt-3 font-bold">{item.label}</p>
                            <p className="mt-1 text-sm text-green-50">{item.text}</p>
                        </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="categorias" className="container-page pb-14">
                <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-700">Explora</p>
                        <h2 className="mt-2 text-3xl font-black text-slate-950">Categorías principales</h2>
                    </div>

                    <Button href="/login" variant="secondary">Ver marketplace</Button>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {categories.map((category) => (
                        <CategoryCard key={category.title} {...category} />
                    ))}
                </div>
            </section>
        </main>
    );
}
