import Link from "next/link";

import { clsx } from "clsx";
import { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

// Para mantener consistencia, se establecen los siguientes tamaños y estilos permitidos:
type ButtonSize = "sm" | "md" | "lg";
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

// Aquí se definen las clases según el tamaño:
const sizeClasses: Record<ButtonSize, string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-base",
};

// Aquí se definen los colores según el estilo:
const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-green-600 text-white hover:bg-green-700 border-green-600 shadow-sm shadow-green-900/10",
    secondary: "bg-white text-slate-800 hover:bg-slate-50 border-slate-200",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 border-transparent",
    danger: "bg-red-600 text-white hover:bg-red-700 border-red-600",
};

type BaseProps = {
    children: ReactNode;      // Contenido del botón
    variant?: ButtonVariant;  // Estilo visual del botón
    size?: ButtonSize;        // Tamaño del botón
    className?: string;       // Clases extra opcionales
};

// Props para cuando el botón funciona como enlace
type LinkButtonProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

// Props para cuando el botón funciona como botón normal
type NativeButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };

export function Button(props: LinkButtonProps | NativeButtonProps) {
    // 1) Se extrae las props principales y deja el resto en rest:
    const {
        children,
        variant = "primary",
        size = "md",
        className,
        ...rest
    } = props;

    // 2) Une las clases base con las clases de tamaño, estilo y extras:
    const classes = clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl border font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className
    );

    // 3) Si recibe href, se renderiza como Link:
    if ("href" in props && props.href) {
        return (
        <Link className={classes} href={props.href} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
            {children}
        </Link>
        );
    }

    // 4) Si no recibe href, se renderiza como button:
    return (
        <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
        {children}
        </button>
    );
}
