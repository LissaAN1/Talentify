"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/Skeleton";
import { getRequiredRolesForPath } from "@/constants/protected-routes";

export function ProtectedShell({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, hasRole } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const requiredRoles = useMemo(() => {
        return getRequiredRolesForPath(pathname);
    }, [pathname]);

    const isAuthorized = isAuthenticated && hasRole(requiredRoles);

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated) {
            router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        if (!isAuthorized) {
            router.replace("/forbidden");
        }
    }, [isAuthenticated, isAuthorized, isLoading, pathname, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-slate-50">
                <div className="hidden w-72 shrink-0 lg:block">
                    <div className="p-5">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="mt-8 h-32 w-full" />
                        <Skeleton className="mt-6 h-10 w-full" />
                        <Skeleton className="mt-2 h-10 w-full" />
                        <Skeleton className="mt-2 h-10 w-full" />
                    </div>
                </div>

                <main className="min-w-0 flex-1 px-4 py-6 md:px-8 lg:px-10">
                    <div className="mx-auto max-w-6xl">
                        <Skeleton className="h-96 w-full" />
                    </div>
                </main>
            </div>
        );
    }

    if (!isAuthenticated || !isAuthorized) {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Navbar />

            <main className="min-w-0 flex-1 px-4 py-6 md:px-8 lg:px-10">
                <div className="mx-auto max-w-6xl">{children}</div>
            </main>
        </div>
    );
}
