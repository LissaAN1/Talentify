import type { Page, Route } from "@playwright/test";
import { continueIfFrontendRoute } from "./api-route";

export type MockUser = {
    id: string;
    name: string;
    email: string;
    roles: string[];
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    isTwoFactorEnabled?: boolean;
};

export const mockUsers: MockUser[] = [
    {
        id: "user-1",
        name: "Admin Talentify",
        email: "admin@u.icesi.edu.co",
        roles: ["ADMIN"],
        isActive: true,
        createdAt: "2026-05-27T10:00:00.000Z",
        updatedAt: "2026-05-27T10:00:00.000Z",
        isTwoFactorEnabled: false,
    },
    {
        id: "user-2",
        name: "Cliente Demo",
        email: "client@u.icesi.edu.co",
        roles: ["CLIENT"],
        isActive: false,
        createdAt: "2026-05-27T10:00:00.000Z",
        updatedAt: "2026-05-27T10:00:00.000Z",
        isTwoFactorEnabled: false,
    },
];

type MockUsersApiOptions = {
    users?: MockUser[];
    listError?: boolean;
    detailError?: boolean;
    createError?: boolean;
    updateError?: boolean;
    updateRolesError?: boolean;
    deleteError?: boolean;
};

export async function mockUsersApi(page: Page, options: MockUsersApiOptions = {}) {
    const users = [...(options.users ?? mockUsers)];

    const requests = {
        createdUsers: [] as unknown[],
        updatedUsers: [] as unknown[],
        roleUpdates: [] as unknown[],
        deletedUsers: [] as string[],
    };

    function getUserIdFromUrl(url: string) {
        const pathname = new URL(url).pathname;
        const parts = pathname.split("/");
        return parts[parts.length - 1];
    }

    function getUserIdFromRolesUrl(url: string) {
        const pathname = new URL(url).pathname;
        const parts = pathname.split("/");
        return parts[parts.length - 2];
    }

    function findUser(id: string) {
        return users.find((user) => user.id === id);
    }

    await page.route("**/users/me", async (route: Route) => {
        if (await continueIfFrontendRoute(route)) return;

        const method = route.request().method();

        if (method === "PUT") {
            const body = route.request().postDataJSON();
            requests.updatedUsers.push({
                id: "me",
                payload: body,
            });

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ ...users[0], ...body }),
            });
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(users[0]),
        });
    });

    await page.route(/.*\/users\/[^/]+\/roles$/, async (route: Route) => {
        if (await continueIfFrontendRoute(route)) return;

        const userId = getUserIdFromRolesUrl(route.request().url());
        const body = route.request().postDataJSON();

        requests.roleUpdates.push({
            userId,
            payload: body,
        });

        if (options.updateRolesError) {
            await route.fulfill({
                status: 400,
                contentType: "application/json",
                body: JSON.stringify({
                    message: "No se pudieron actualizar los roles.",
                }),
            });
            return;
        }

        const user = findUser(userId);

        if (!user) {
            await route.fulfill({
                status: 404,
                contentType: "application/json",
                body: JSON.stringify({
                    message: "Usuario no encontrado.",
                }),
            });
            return;
        }

        const updatedUser = {
            ...user,
            roles: body.roles,
        };

        const index = users.findIndex((item) => item.id === userId);
        users[index] = updatedUser;

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(updatedUser),
        });
    });

    await page.route(/.*\/users\/[^/]+$/, async (route: Route) => {
        if (await continueIfFrontendRoute(route)) return;

        const method = route.request().method();
        const userId = getUserIdFromUrl(route.request().url());
        const user = findUser(userId);

        if (options.detailError || !user) {
            await route.fulfill({
                status: 404,
                contentType: "application/json",
                body: JSON.stringify({
                    message: "Usuario no encontrado.",
                }),
            });
            return;
        }

        if (method === "PUT") {
            const body = route.request().postDataJSON();
            requests.updatedUsers.push({
                id: userId,
                payload: body,
            });

            if (options.updateError) {
                await route.fulfill({
                    status: 400,
                    contentType: "application/json",
                    body: JSON.stringify({
                        message: "No se pudo actualizar el usuario.",
                    }),
                });
                return;
            }

            const updatedUser = {
                ...user,
                ...body,
            };

            const index = users.findIndex((item) => item.id === userId);
            users[index] = updatedUser;

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(updatedUser),
            });
            return;
        }

        if (method === "DELETE") {
            requests.deletedUsers.push(userId);

            if (options.deleteError) {
                await route.fulfill({
                    status: 400,
                    contentType: "application/json",
                    body: JSON.stringify({
                        message: "No se pudo desactivar el usuario.",
                    }),
                });
                return;
            }

            const deletedUser = {
                ...user,
                isActive: false,
            };

            const index = users.findIndex((item) => item.id === userId);
            users[index] = deletedUser;

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(deletedUser),
            });
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(user),
        });
    });

    await page.route(/.*\/users$/, async (route: Route) => {
        if (await continueIfFrontendRoute(route)) return;

        const method = route.request().method();

        if (method === "GET") {
            if (options.listError) {
                await route.fulfill({
                    status: 500,
                    contentType: "application/json",
                    body: JSON.stringify({
                        message: "No se pudieron cargar los usuarios.",
                    }),
                });
                return;
            }

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(users),
            });
            return;
        }

        if (method === "POST") {
            const body = route.request().postDataJSON();
            requests.createdUsers.push(body);

            if (options.createError) {
                await route.fulfill({
                    status: 400,
                    contentType: "application/json",
                    body: JSON.stringify({
                        message: "No se pudo crear el usuario.",
                    }),
                });
                return;
            }

            const createdUser: MockUser = {
                id: "user-3",
                ...body,
                isActive: true,
                createdAt: "2026-05-27T10:00:00.000Z",
                updatedAt: "2026-05-27T10:00:00.000Z",
                isTwoFactorEnabled: false,
            };

            users.push(createdUser);

            await route.fulfill({
                status: 201,
                contentType: "application/json",
                body: JSON.stringify(createdUser),
            });
            return;
        }

        await route.continue();
    });

    return {
        requests,
        getUsers: () => users,
    };
}
