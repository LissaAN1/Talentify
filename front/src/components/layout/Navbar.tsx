"use client";

import Link from "next/link";
import { Bell, BriefcaseBusiness, ClipboardList, LayoutDashboard, LogOut, Search, UserRound, Users } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { ActiveLink } from "@/components/navigation/ActiveLink";

const navItems = [
   { href: "/dashboard", label: "Panel", icon: LayoutDashboard, roles: ["ADMIN", "PROVIDER", "CLIENT"] },
   { href: "/marketplace", label: "Marketplace", icon: Search, roles: ["ADMIN", "PROVIDER", "CLIENT"] },
   { href: "/services", label: "Servicios", icon: BriefcaseBusiness, roles: ["ADMIN", "PROVIDER"] },
   { href: "/orders", label: "Órdenes", icon: ClipboardList, roles: ["ADMIN", "PROVIDER", "CLIENT"] },
   { href: "/users", label: "Usuarios", icon: Users, roles: ["ADMIN"] },
   { href: "/profile", label: "Perfil", icon: UserRound, roles: ["ADMIN", "PROVIDER", "CLIENT"] },
] as const;

export function Navbar() {
    // TODO: Reemplazar por el usuario real desde useAuthStore:
    const user = {
        name: "Usuario",
        email: "usuario@correo.com",
        roles: ["CLIENT"],
    };
    
    // TODO: Reemplazar por la función real de cierre de sesión:
    const logout = () => {
        console.log("TODO: cerrar sesión");
    };

    // TODO: Filtrar con hasAnyRole cuando esté listo el sistema de permisos:
    const visibleItems = navItems;

    return (
        <aside className="hidden min-h-screen w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 flex h-screen flex-col p-5">
            <Link href="/dashboard" className="text-3xl font-black tracking-tight text-slate-950">
            Talent<span className="text-green-600">ify</span>
            </Link>

            <div className="mt-8 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">{user.name}</p>

                <p className="mt-1 truncate text-xs font-medium text-slate-500">{user.email}</p>
                
                <div className="mt-3 flex flex-wrap gap-1">
                {user.roles.map((role) => (
                    <span key={role} className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-green-700 ring-1 ring-green-100">
                    {role}
                    </span>
                ))}
                </div>
            </div>

            <nav className="mt-6 grid gap-1">
                {visibleItems.map((item) => (
                    <ActiveLink key={item.href} href={item.href} label={item.label} icon={item.icon} exact={item.href === "/dashboard"} />
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
