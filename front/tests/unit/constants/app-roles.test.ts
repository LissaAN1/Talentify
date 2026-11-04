import { describe, expect, it } from "vitest";

import { AppRoles, hasRole, isAdmin, isClient, isProvider, roleLabels, roleOptions } from "@/constants/app-roles";

describe("app-roles", () => {
    describe("AppRoles", () => {
        it("define los roles principales de la aplicación", () => {
            expect(AppRoles.ADMIN).toBe("ADMIN");
            expect(AppRoles.PROVIDER).toBe("PROVIDER");
            expect(AppRoles.CLIENT).toBe("CLIENT");
        });
    });

    describe("roleLabels", () => {
        it("asocia cada rol con su etiqueta visible", () => {
            expect(roleLabels[AppRoles.ADMIN]).toBe("Administrador");
            expect(roleLabels[AppRoles.PROVIDER]).toBe("Proveedor");
            expect(roleLabels[AppRoles.CLIENT]).toBe("Cliente");
        });

        it("tiene etiqueta para todos los roles definidos", () => {
            for (const role of Object.values(AppRoles)) {
                expect(roleLabels[role]).toBeDefined();
                expect(roleLabels[role].length).toBeGreaterThan(0);
            }
        });
    });

    describe("roleOptions", () => {
        it("genera opciones reutilizables para selects o formularios", () => {
            expect(roleOptions).toEqual([
                { value: AppRoles.ADMIN, label: "Administrador" },
                { value: AppRoles.PROVIDER, label: "Proveedor" },
                { value: AppRoles.CLIENT, label: "Cliente" },
            ]);
        });

        it("incluye exactamente una opción por cada rol", () => {
            expect(roleOptions).toHaveLength(Object.values(AppRoles).length);

            for (const role of Object.values(AppRoles)) {
                expect(roleOptions).toContainEqual({
                    value: role,
                    label: roleLabels[role],
                });
            }
        });
    });

    describe("hasRole", () => {
        it("retorna true si no se requieren roles específicos", () => {
            expect(hasRole([], [])).toBe(true);
            expect(hasRole([AppRoles.CLIENT], [])).toBe(true);
        });

        it("retorna true si el usuario tiene al menos uno de los roles requeridos", () => {
            expect(
                hasRole(
                    [AppRoles.CLIENT],
                    [AppRoles.ADMIN, AppRoles.CLIENT]
                )
            ).toBe(true);
        });

        it("retorna false si el usuario no tiene ninguno de los roles requeridos", () => {
            expect(
                hasRole(
                    [AppRoles.CLIENT],
                    [AppRoles.ADMIN, AppRoles.PROVIDER]
                )
            ).toBe(false);
        });
    });

    describe("helpers de rol", () => {
        it("isAdmin identifica usuarios administradores", () => {
            expect(isAdmin([AppRoles.ADMIN])).toBe(true);
            expect(isAdmin([AppRoles.CLIENT])).toBe(false);
        });

        it("isProvider identifica usuarios proveedores", () => {
            expect(isProvider([AppRoles.PROVIDER])).toBe(true);
            expect(isProvider([AppRoles.CLIENT])).toBe(false);
        });

        it("isClient identifica usuarios cliente", () => {
            expect(isClient([AppRoles.CLIENT])).toBe(true);
            expect(isClient([AppRoles.ADMIN])).toBe(false);
        });
    });
});
