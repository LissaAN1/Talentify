import { clsx } from "clsx";
import { LucideIcon } from "lucide-react";

const toneClasses = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    slate: "bg-slate-100 text-slate-700",
};

type StatCardProps = {
    title: string;                    // Título de la estadística
    value: string;                    // Valor principal que se mostrará
    icon: LucideIcon;                 // Ícono de la tarjeta
    tone?: keyof typeof toneClasses;  // Color visual de la tarjeta
};

// Se puede utilizar para mostrar cantidad de servicios, órdenes, ingresos o usuarios:
export function StatCard({ title, value, icon: Icon, tone = "green" }: StatCardProps) {
    return (
        <article className="tf-card p-5">
            <div className={clsx("flex h-12 w-12 items-center justify-center rounded-2xl", toneClasses[tone])}>
                <Icon className="h-6 w-6" />
            </div>

            <p className="mt-5 text-sm font-bold text-slate-500">{title}</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
        </article>
    );
}
