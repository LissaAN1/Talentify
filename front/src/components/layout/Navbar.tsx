"use client";

import Link from "next/link";
import { Bell, BriefcaseBusiness, ClipboardList, LayoutDashboard, LogOut, Search, UserRound, Users } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { ActiveLink } from "@/components/navigation/ActiveLink";
import { useAuth } from "@/hooks/useAuth";
import { AppRoles } from "@/constants/app-roles";

const navItems = [
    { href: "/dashboard", label: "Panel", icon: LayoutDashboard, roles: [AppRoles.ADMIN, AppRoles.PROVIDER, AppRoles.CLIENT] },
    { href: "/marketplace", label: "Marketplace", icon: Search, roles: [AppRoles.ADMIN, AppRoles.PROVIDER, AppRoles.CLIENT] },
    { href: "/services", label: "Servicios", icon: BriefcaseBusiness, roles: [AppRoles.ADMIN, AppRoles.PROVIDER] },
    { href: "/orders", label: "Órdenes", icon: ClipboardList, roles: [AppRoles.ADMIN, AppRoles.PROVIDER, AppRoles.CLIENT] },
    { href: "/users", label: "Usuarios", icon: Users, roles: [AppRoles.ADMIN] },
    { href: "/profile", label: "Perfil", icon: UserRound, roles: [AppRoles.ADMIN, AppRoles.PROVIDER, AppRoles.CLIENT] },
]

export function Navbar() {
    const { user, logout, isAdmin, isProvider } = useAuth();

    const visibleItems = navItems.filter(item => {
        if (isAdmin()) return true;
        if (isProvider()) return item.roles.includes(AppRoles.PROVIDER);
        return item.roles.includes(AppRoles.CLIENT);
    });

    const getRoleBadgeColor = (role: AppRoles): string => {
        switch (role) {
            case AppRoles.ADMIN:
                return "bg-purple-100 text-purple-700 ring-purple-200";
            case AppRoles.PROVIDER:
                return "bg-blue-100 text-blue-700 ring-blue-200";
            case AppRoles.CLIENT:
                return "bg-green-100 text-green-700 ring-green-200";
            default:
                return "bg-slate-100 text-slate-700 ring-slate-200";
        }
    };

    return (
        <aside className="hidden min-h-screen w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
            <div className="sticky top-0 flex h-screen flex-col p-5">
                <Link href="/dashboard" className="text-3xl font-black tracking-tight text-slate-950">
                    Talent<span className="text-green-600">ify</span>
                </Link>

                <div className="mt-8 rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-950">{user?.name || "Usuario"}</p>
                    <p className="mt-1 truncate text-xs font-medium text-slate-500">{user?.email}</p>

                    <div className="mt-3 flex flex-wrap gap-1">
                        {user?.roles.map((role) => (
                            <span
                                key={role}
                                className={`rounded-full px-2 py-1 text-[10px] font-black ring-1 ${getRoleBadgeColor(role)}`}
                            >
                                {role}
                            </span>
                        ))}
                    </div>
                </div>

                <nav className="mt-6 grid gap-1">
                    {visibleItems.map((item) => (
                        <ActiveLink
                            key={item.href}
                            href={item.href}
                            label={item.label}
                            icon={item.icon}
                            exact={item.href === "/dashboard"}
                        />
                    ))}
                </nav>

                <div className="mt-auto grid gap-3">
                    <Button variant="secondary" className="justify-start">
                        <Bell className="h-4 w-4" />
                        Notificaciones
                    </Button>

                    <Button variant="ghost" className="justify-start" onClick={logout}>
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                    </Button>
                </div>
            </div>
        </aside>
    );
}
