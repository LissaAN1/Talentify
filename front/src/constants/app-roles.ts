export enum AppRoles {
    ADMIN = "ADMIN",
    PROVIDER = "PROVIDER",
    CLIENT = "CLIENT",
}

export const roleLabels: Record<AppRoles, string> = {
    [AppRoles.ADMIN]: "Administrador",
    [AppRoles.PROVIDER]: "Proveedor",
    [AppRoles.CLIENT]: "Cliente",
};

export const roleOptions = [
    { value: AppRoles.ADMIN, label: roleLabels[AppRoles.ADMIN] },
    { value: AppRoles.PROVIDER, label: roleLabels[AppRoles.PROVIDER] },
    { value: AppRoles.CLIENT, label: roleLabels[AppRoles.CLIENT] },
];

export function hasRole(userRoles: AppRoles[], requiredRoles: AppRoles[]): boolean {
    if (requiredRoles.length === 0) return true;
    return requiredRoles.some(role => userRoles.includes(role));
}

export function isAdmin(userRoles: AppRoles[]): boolean {
    return userRoles.includes(AppRoles.ADMIN);
}

export function isProvider(userRoles: AppRoles[]): boolean {
    return userRoles.includes(AppRoles.PROVIDER);
}

export function isClient(userRoles: AppRoles[]): boolean {
    return userRoles.includes(AppRoles.CLIENT);
}
