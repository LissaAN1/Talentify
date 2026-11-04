export enum AppRoles {
  ADMIN = 'ADMIN',
  PROVIDER = 'PROVIDER',
  CLIENT = 'CLIENT',
}

export const RolePermissions = {
  [AppRoles.ADMIN]: ['*'], // Admin tiene todos los permisos
  [AppRoles.PROVIDER]: [
    'create:service',
    'update:service',
    'delete:service',
    'read:orders',
  ],
  [AppRoles.CLIENT]: ['create:order', 'read:services', 'read:my-orders'],
} as const;

export type Permission =
  (typeof RolePermissions)[keyof typeof RolePermissions][number];
