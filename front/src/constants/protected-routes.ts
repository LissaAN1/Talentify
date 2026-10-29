import {AppRoles} from "@/constants/app-roles";

type ProtectedRouteRule = {
    path: string;
    roles: AppRoles[];
};

export const protectedRouteRules: ProtectedRouteRule[] = [
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
];

export function getRequiredRolesForPath(pathname: string): AppRoles[] {

    if (
        pathname.startsWith("/services/") &&
        !pathname.endsWith("/edit") &&
        pathname !== "/services/new"
    ) {
        return [
            AppRoles.ADMIN,
            AppRoles.PROVIDER,
            AppRoles.CLIENT,
        ];
    }
    const rule = protectedRouteRules.find((item) =>
        pathname === item.path || pathname.startsWith(`${item.path}/`)
    );

    return rule?.roles ?? [];
}
