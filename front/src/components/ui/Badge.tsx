import { clsx } from "clsx";
import { HTMLAttributes } from "react";

// Tipos de badge permitidos:
type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "blue";

const classes: Record<BadgeVariant, string> = {
    success: "bg-green-50 text-green-700 ring-green-200",
    warning: "bg-amber-50 text-amber-700 ring-amber-200",
    danger: "bg-red-50 text-red-700 ring-red-200",
    neutral: "bg-slate-100 text-slate-700 ring-slate-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
    variant?: BadgeVariant; // Estilo visual del badge
};

// Se puede utilizar para mostrar estados, roles o categorías dentro de la interfaz!!!
export function Badge({ className, children, variant = "neutral", ...props }: BadgeProps) {
    return (
        <span
            className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ring-1", classes[variant], className)}
            {...props}
        >
            {children}
        </span>
    );
}
