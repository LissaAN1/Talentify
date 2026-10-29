import { clsx } from "clsx";
import { HTMLAttributes } from "react";

// Sirve para mostrar un placeholder de carga mientras llega la información real:
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={clsx("animate-pulse rounded-xl bg-slate-200", className)} {...props} />;
}
