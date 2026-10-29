import { describe, expect, it } from "vitest";

import { AppRoles } from "@/constants/app-roles";
import { createUserStore, defaultInitState, type UserState } from "@/store/userStore";

describe("userStore", () => {
    it("inicia con el estado por defecto", () => {
        const store = createUserStore();

        expect(store.getState()).toMatchObject(defaultInitState);
    });

    it("setUser guarda el usuario y marca la sesión como autenticada", () => {
        const store = createUserStore();

        store.getState().setUser({
            id: "user-1",
            name: "Usuario Test",
            email: "usuario@u.icesi.edu.co",
            roles: [AppRoles.CLIENT],
            token: "jwt-token",
        });

        expect(store.getState()).toMatchObject({
            id: "user-1",
            name: "Usuario Test",
            email: "usuario@u.icesi.edu.co",
            roles: [AppRoles.CLIENT],
            token: "jwt-token",
            isAuthenticated: true,
            isLoading: false,
        });
    });

    it("setToken actualiza únicamente el token", () => {
        const store = createUserStore();

        store.getState().setUser({
            id: "user-1",
            name: "Usuario Test",
            email: "usuario@u.icesi.edu.co",
            roles: [AppRoles.CLIENT],
            token: "old-token",
        });

        store.getState().setToken("new-token");

        expect(store.getState().token).toBe("new-token");
        expect(store.getState().id).toBe("user-1");
        expect(store.getState().isAuthenticated).toBe(true);
    });

    it("setLoading actualiza el estado de carga", () => {
        const store = createUserStore();

        store.getState().setLoading(true);
        expect(store.getState().isLoading).toBe(true);

        store.getState().setLoading(false);
        expect(store.getState().isLoading).toBe(false);
    });

    it("clearUser limpia la sesión y regresa al estado inicial", () => {
        const store = createUserStore();

        store.getState().setUser({
            id: "user-1",
            name: "Usuario Test",
            email: "usuario@u.icesi.edu.co",
            roles: [AppRoles.ADMIN],
            token: "jwt-token",
        });

        store.getState().clearUser();

        expect(store.getState()).toMatchObject(defaultInitState);
    });

    it("permite crear el store con un estado inicial personalizado", () => {
        const customState: UserState = {
            id: "admin-1",
            name: "Admin Test",
            email: "admin@u.icesi.edu.co",
            roles: [AppRoles.ADMIN],
            token: "admin-token",
            isAuthenticated: true,
            isLoading: false,
        };

        const store = createUserStore(customState);

        expect(store.getState()).toMatchObject(customState);
    });
});
