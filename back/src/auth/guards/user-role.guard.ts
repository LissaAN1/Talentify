import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { User } from '../../users/entities/user.entity';
import { META_ROLES } from '../decorators/role-protected.decorator';
import { AppRoles } from '../interfaces/app-roles';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const validRoles =
      this.reflector.getAllAndOverride<AppRoles[]>(META_ROLES, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    if (validRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new BadRequestException('Usuario no encontrado en la petición');
    }

    if (!user.roles || user.roles.length === 0) {
      throw new ForbiddenException('El usuario no tiene roles asignados');
    }

    const hasRole = user.roles.some((role) => validRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `No tienes permisos para acceder a este recurso. Roles requeridos: [${validRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
