import { expect, type BrowserContext } from "@playwright/test";

export type TestRole = "ADMIN" | "PROVIDER" | "CLIENT";

export type TestUser = {
    id: string;
    name: string;
    email: string;
    roles: TestRole[];
};

export const testUsers: Record<TestRole, TestUser> = {
    ADMIN: {
        id: "admin-1",
        name: "Admin Test",
        email: "admin@u.icesi.edu.co",
        roles: ["ADMIN"],
    },
    PROVIDER: {
        id: "provider-1",
        name: "Provider Test",
        email: "provider@u.icesi.edu.co",
        roles: ["PROVIDER"],
    },
    CLIENT: {
        id: "client-1",
        name: "Client Test",
        email: "client@u.icesi.edu.co",
        roles: ["CLIENT"],
    },
};

export function backendUser(user: TestUser) {
    return {
        id: user.id,
        nombre: user.name,
        correo: user.email,
        roles: user.roles,
    };
}

export function loginResponse(
    user: TestUser,
    token = `${user.roles[0].toLowerCase()}-jwt-token`,
) {
    return {
        usuario: backendUser(user),
        token,
    };
}

export async function loginAs(
    context: BrowserContext,
    role: TestRole = "ADMIN",
    baseURL?: string,
) {
    const user = testUsers[role];

    const appUrl =
        baseURL ||
        process.env.PLAYWRIGHT_BASE_URL ||
        "http://localhost:3001";

    const { hostname } = new URL(appUrl);

    await context.addCookies([
        {
            name: "token",
            value: `${role.toLowerCase()}-test-token`,
            domain: hostname,
            path: "/",
        },
        {
            name: "currentUser",
            value: encodeURIComponent(
                JSON.stringify({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    roles: user.roles,
                }),
            ),
            domain: hostname,
            path: "/",
        },
    ]);

    return user;
}

export async function clearSession(context: BrowserContext) {
    await context.clearCookies();
}

export async function expectCookieValue(
    context: BrowserContext,
    name: string,
    value: string,
) {
    const cookies = await context.cookies();
    const cookie = cookies.find((item) => item.name === name);

    expect(cookie?.value).toBe(value);
}

export async function expectCookieExists(context: BrowserContext, name: string) {
    const cookies = await context.cookies();
    const cookie = cookies.find((item) => item.name === name);

    expect(cookie).toBeTruthy();
}

export async function expectCookieMissing(context: BrowserContext, name: string) {
    const cookies = await context.cookies();
    const cookie = cookies.find((item) => item.name === name);

    expect(cookie).toBeUndefined();
}
