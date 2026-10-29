import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AppRoles } from '../interfaces/app-roles';
import { UserRoleGuard } from './user-role.guard';

describe('UserRoleGuard', () => {
  let guard: UserRoleGuard;
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };

  const createContext = (user?: unknown): ExecutionContext =>
    ({
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    };

    guard = new UserRoleGuard(reflector as unknown as Reflector);
  });

  it('debe permitir acceso si la ruta no exige roles', () => {
    reflector.getAllAndOverride.mockReturnValue([]);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('debe lanzar BadRequestException si no hay user en request', () => {
    reflector.getAllAndOverride.mockReturnValue([AppRoles.ADMIN]);

    expect(() => guard.canActivate(createContext(undefined))).toThrow(
      BadRequestException,
    );
  });

  it('debe lanzar ForbiddenException si el usuario no tiene roles', () => {
    reflector.getAllAndOverride.mockReturnValue([AppRoles.ADMIN]);

    expect(() =>
      guard.canActivate(
        createContext({
          id: '1',
          roles: [],
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('debe lanzar ForbiddenException si el usuario no tiene un rol permitido', () => {
    reflector.getAllAndOverride.mockReturnValue([AppRoles.ADMIN]);

    expect(() =>
      guard.canActivate(
        createContext({
          id: '1',
          roles: [AppRoles.CLIENT],
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('debe permitir acceso si el usuario tiene al menos un rol permitido', () => {
    reflector.getAllAndOverride.mockReturnValue([
      AppRoles.PROVIDER,
      AppRoles.CLIENT,
    ]);

    expect(
      guard.canActivate(
        createContext({
          id: '1',
          roles: [AppRoles.CLIENT],
        }),
      ),
    ).toBe(true);
  });

  it('debe permitir acceso si el reflector no retorna metadata de roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(
      guard.canActivate(
        createContext({
          id: '1',
          roles: [AppRoles.CLIENT],
        }),
      ),
    ).toBe(true);
  });

  it('debe lanzar ForbiddenException si el usuario no tiene la propiedad roles', () => {
    reflector.getAllAndOverride.mockReturnValue([AppRoles.ADMIN]);

    expect(() =>
      guard.canActivate(
        createContext({
          id: '1',
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('debe incluir los roles requeridos en el mensaje de error cuando el usuario no tiene permisos', () => {
    reflector.getAllAndOverride.mockReturnValue([
      AppRoles.ADMIN,
      AppRoles.PROVIDER,
    ]);

    expect(() =>
      guard.canActivate(
        createContext({
          id: '1',
          roles: [AppRoles.CLIENT],
        }),
      ),
    ).toThrow(
      'No tienes permisos para acceder a este recurso. Roles requeridos: [ADMIN, PROVIDER]',
    );
  });

  it('debe permitir acceso si el usuario tiene más roles y uno coincide con los permitidos', () => {
    reflector.getAllAndOverride.mockReturnValue([AppRoles.PROVIDER]);

    expect(
      guard.canActivate(
        createContext({
          id: '1',
          roles: [AppRoles.CLIENT, AppRoles.PROVIDER],
        }),
      ),
    ).toBe(true);
  });
});
