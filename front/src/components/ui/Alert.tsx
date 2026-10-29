import { clsx } from "clsx";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

// Tipos de alerta permitidos, así evitamos usar window.alert!
type AlertVariant = "info" | "success" | "warning" | "danger";

const styles = {
    info: {
        box: "border-blue-200 bg-blue-50 text-blue-900",
        icon: Info,
    },
    success: {
        box: "border-green-200 bg-green-50 text-green-900",
        icon: CheckCircle2,
    },
    warning: {
        box: "border-amber-200 bg-amber-50 text-amber-900",
        icon: TriangleAlert,
    },
    danger: {
        box: "border-red-200 bg-red-50 text-red-900",
        icon: AlertCircle,
    },
};

type AlertProps = {
    variant?: AlertVariant; // Tipo de alerta
    title: string;          // Título de la alerta
    message?: string;       // Mensaje opcional
    className?: string;     // Clases extra opcionales
};

// "className?"" es para hacer pequeños ajustes al diseño del componente.

export function Alert({ variant = "info", title, message, className }: AlertProps) {
    const Icon = styles[variant].icon;

    return (
        <div className={clsx("rounded-2xl border p-4", styles[variant].box, className)}>
            <div className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                    <p className="font-black">{title}</p>
                    {message && <p className="mt-1 text-sm leading-6 opacity-85">{message}</p>}
                </div>
            </div>
        </div>
    );
}
