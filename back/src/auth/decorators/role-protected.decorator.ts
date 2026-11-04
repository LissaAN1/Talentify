import { SetMetadata } from '@nestjs/common';
import { AppRoles } from '../interfaces/app-roles';

export const META_ROLES = 'roles';

export const RoleProtected = (...roles: AppRoles[]) => {
  return SetMetadata(META_ROLES, roles);
};
