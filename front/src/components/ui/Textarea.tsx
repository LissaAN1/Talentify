import { clsx } from "clsx";
import { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;         // Texto que se muestra arriba del textarea
    helperText?: string;    // Texto de ayuda debajo del textarea
    error?: string;         // Mensaje de error debajo del textarea
};

// Utilizar este componente para campos de texto largos
export function Textarea({ label, helperText, error, className, id, ...props }: TextareaProps) {
    // Crea el id del textarea usando primero id, luego name, y si no existen, lo genera desde el label.
    const textareaId = id ?? props.name ?? label?.toLowerCase().replaceAll(" ", "-");

    return (
        <label className="block" htmlFor={textareaId}>
            {label && <span className="mb-2 block text-sm font-bold text-slate-800">{label}</span>}

            <textarea
                id={textareaId}
                className={clsx(
                    "min-h-32 w-full resize-y rounded-xl border bg-white px-3 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:tf-focus",
                    error ? "border-red-300" : "border-slate-200",
                    className
                )}
                {...props}
            />

            {(helperText || error) && (
                <span className={clsx("mt-2 block text-xs font-medium", error ? "text-red-600" : "text-slate-500")}>
                    {error ?? helperText}
                </span>
            )}
        </label>
    );
}
