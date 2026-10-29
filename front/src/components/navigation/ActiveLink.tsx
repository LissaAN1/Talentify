"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

type ActiveLinkProps = {
    href: string;       // Ruta a la que apunta el link
    label: string;      // Texto que se mostrará en el link
    icon?: LucideIcon;  // Ícono que se mostrará antes del texto (opcional)
    exact?: boolean;    // Si es true, solo activa el link cuando la ruta es exactamente igual!
};

export function ActiveLink({ href, label, icon: Icon, exact = false }: ActiveLinkProps) {
    const pathname = usePathname();
    const active = exact ? pathname === href : pathname.startsWith(href);

    return (
        <Link
        href={href}
        className={clsx(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition",
            active
            ? "bg-green-50 text-green-700"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
        )}
        >
        {Icon && <Icon className="h-4 w-4" />}
        {label}
        </Link>
    );
}
