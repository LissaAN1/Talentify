import { Suspense } from "react";

import { ProtectedShell } from "@/components/layout/ProtectedShell";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Con cacheComponents, las rutas dinámicas (/users/[id], /services/[id]...)
    // necesitan un límite Suspense alrededor de lo que lee la ruta en tiempo de ejecución.
    return (
        <Suspense fallback={null}>
            <ProtectedShell>{children}</ProtectedShell>
        </Suspense>
    );
}
