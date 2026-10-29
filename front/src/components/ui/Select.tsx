import { clsx } from "clsx";
import { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;                                   // Texto que se muestra arriba del select
    helperText?: string;                              // Texto de ayuda debajo del select
    error?: string;                                   // Mensaje de error debajo del select
    options: Array<{ value: string; label: string }>; // Opciones que se muestran en la lista
};

// Utilizar este componente para listas desplegables!
export function Select({ label, helperText, error, options, className, id, ...props }: SelectProps) {
    // Define el id del select: usa primero id; si no existe, usa name; si tampoco existe, genera uno desde label
    const selectId = id ?? props.name ?? label?.toLowerCase().replaceAll(" ", "-");

    return (
        <label className="block" htmlFor={selectId}>
            {label && <span className="mb-2 block text-sm font-bold text-slate-800">{label}</span>}

            <select
                id={selectId}
                className={clsx(
                    "h-11 w-full rounded-xl border bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:tf-focus",
                    error ? "border-red-300" : "border-slate-200",
                    className
                )}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>

            {(helperText || error) && (
                <span className={clsx("mt-2 block text-xs font-medium", error ? "text-red-600" : "text-slate-500")}>
                    {error ?? helperText}
                </span>
            )}
        </label>
    );
}
