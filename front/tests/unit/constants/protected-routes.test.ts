import { describe, expect, it } from "vitest";

import { AppRoles } from "@/constants/app-roles";
import { getRequiredRolesForPath, protectedRouteRules } from "@/constants/protected-routes";

describe("protected-routes", () => {
    it("define reglas de protección para las rutas principales", () => {
        expect(protectedRouteRules).toEqual(
            expect.arrayContaining([
                {
                    path: "/dashboard",
                    roles: [AppRoles.ADMIN, AppRoles.PROVIDER, AppRoles.CLIENT],
                },
                {
                    path: "/marketplace",
                    roles: [AppRoles.ADMIN, AppRoles.PROVIDER, AppRoles.CLIENT],
                },
                {
                    path: "/profile",
                    roles: [AppRoles.ADMIN, AppRoles.PROVIDER, AppRoles.CLIENT],
                },
                {
                    path: "/orders",
                    roles: [AppRoles.ADMIN, AppRoles.PROVIDER, AppRoles.CLIENT],
                },
                {
                    path: "/services",
                    roles: [AppRoles.ADMIN, AppRoles.PROVIDER],
                },
                {
                    path: "/users",
                    roles: [AppRoles.ADMIN],
                },
            ])
        );
    });

    it("retorna roles para una ruta exacta protegida", () => {
        expect(getRequiredRolesForPath("/users")).toEqual([AppRoles.ADMIN]);
    });

    it("retorna roles para rutas hijas de una ruta protegida", () => {
        expect(getRequiredRolesForPath("/users/user-1/edit")).toEqual([
            AppRoles.ADMIN,
        ]);

        expect(getRequiredRolesForPath("/services/new")).toEqual([
            AppRoles.ADMIN,
            AppRoles.PROVIDER,
        ]);
    });

    it("permite dashboard, marketplace, profile y orders para todos los roles autenticados", () => {
        const expectedRoles = [
            AppRoles.ADMIN,
            AppRoles.PROVIDER,
            AppRoles.CLIENT,
        ];

        expect(getRequiredRolesForPath("/dashboard")).toEqual(expectedRoles);
        expect(getRequiredRolesForPath("/marketplace")).toEqual(expectedRoles);
        expect(getRequiredRolesForPath("/profile")).toEqual(expectedRoles);
        expect(getRequiredRolesForPath("/orders")).toEqual(expectedRoles);
    });

    it("retorna arreglo vacío para rutas públicas o no registradas", () => {
        expect(getRequiredRolesForPath("/")).toEqual([]);
        expect(getRequiredRolesForPath("/login")).toEqual([]);
        expect(getRequiredRolesForPath("/register")).toEqual([]);
        expect(getRequiredRolesForPath("/ruta-inexistente")).toEqual([]);
    });

    it("todas las reglas tienen path y arreglo de roles", () => {
        for (const rule of protectedRouteRules) {
            expect(rule.path).toMatch(/^\/[a-z]/);
            expect(Array.isArray(rule.roles)).toBe(true);
            expect(rule.roles.length).toBeGreaterThan(0);
        }
    });
});
