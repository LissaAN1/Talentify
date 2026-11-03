import { InputHTMLAttributes } from "react";

import { clsx } from "clsx";
import { LucideIcon } from "lucide-react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    label?: string;        // Texto que se muestra arriba del input
    helperText?: string;   // Texto de ayuda debajo del input
    error?: string;        // Mensaje de error debajo del input
    icon?: LucideIcon;     // Ícono opcional dentro del input
};

export function Input({ label, helperText, error, icon: Icon, className, id, ...props }: InputProps) {
    // Define el id del input: usa primero id; si no existe, usa name; si tampoco existe, genera uno desde label
    const inputId = id ?? props.name ?? label?.toLowerCase().replaceAll(" ", "-");

    return (
        // Asocia el label con el input:
        <label className="block" htmlFor={inputId}>
        
        {label && <span className="mb-2 block text-sm font-bold text-slate-800">{label}</span>}

        <span className="relative block">
            {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}

            <input
            id={inputId}
            className={clsx(
                "h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:tf-focus",
                Icon && "pl-10",
                error ? "border-red-300" : "border-slate-200",
                className
            )}{...props}
            />
        </span>

        {(helperText || error) && (
            <span className={clsx("mt-2 block text-xs font-medium", error ? "text-red-600" : "text-slate-500")}>
            {error ?? helperText}
            </span>
        )}
        </label>
    );
}
