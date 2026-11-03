import { ReactNode } from "react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
    title: string;        // Título principal del estado vacío
    description: string;  // Descripción que explica por qué no hay contenido!
    action?: ReactNode;   // Acción opcional, como un botón o enlace
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
    return (
        <section className="tf-card flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Inbox className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2>
            <p className="mt-2 max-w-md leading-7 text-slate-600">{description}</p>

            {action && <div className="mt-6">{action}</div>}
        </section>
    );
}
