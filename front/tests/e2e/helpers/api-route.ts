import type { Route } from "@playwright/test";

export const API_ORIGIN =
    process.env.NEXT_PUBLIC_API_URL ?? "http://talentify-api.test";

export function isBackendRoute(route: Route) {
    const url = new URL(route.request().url());
    return url.origin === API_ORIGIN;
}

export async function continueIfFrontendRoute(route: Route) {
    if (!isBackendRoute(route)) {
        await route.continue();
        return true;
    }

    return false;
}
