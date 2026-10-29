import { ReactNode } from "react";

type PageHeaderProps = {
    eyebrow?: string;      // Texto pequeño superior, como categoría o sección
    title?: string;         // Título principal de la página
    description?: string;  // Descripción opcional debajo del título
    action?: ReactNode;    // Acción opcional, como un botón o enlace
};

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
    return (
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
                {eyebrow && <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">{eyebrow}</p>}
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h1>
                {description && <p className="mt-3 max-w-3xl leading-7 text-slate-600">{description}</p>}
            </div>

            {action && <div className="shrink-0">{action}</div>}
        </header>
    );
}
