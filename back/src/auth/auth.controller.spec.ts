import type { Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { AppRoles } from './interfaces/app-roles';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: Record<string, Mock>;

  const mockUser: Omit<User, 'password'> = {
    id: '1',
    name: 'Usuario Test',
    email: 'test@u.icesi.edu.co',
    roles: [AppRoles.CLIENT],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    refreshToken: null,
    isTwoFactorEnabled: false,
    twoFactorSecret: undefined,
  };

  beforeEach(async () => {
    mockAuthService = {
      createUser: vi.fn(),
      loginUser: vi.fn(),
      logout: vi.fn(),
      generar2faSecret: vi.fn(),
      habilitar2fa: vi.fn(),
      verificar2fa: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('registrar', () => {
    it('debe llamar a authService.createUser y retornar el usuario creado', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Usuario Test',
        email: 'test@u.icesi.edu.co',
        password: 'Test123456',
        roles: [AppRoles.ADMIN],
      };

      mockAuthService.createUser.mockResolvedValue(mockUser);

      const result = await controller.registrar(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockAuthService.createUser).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('login', () => {
    it('debe llamar a authService.loginUser y retornar usuario con token', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@u.icesi.edu.co',
        password: 'Test123456',
      };

      const loginResponse = {
        usuario: {
          id: mockUser.id,
          nombre: mockUser.name,
          correo: mockUser.email,
          roles: mockUser.roles,
        },
        token: 'jwt-token-test',
      };

      mockAuthService.loginUser.mockResolvedValue(loginResponse);

      const result = await controller.login(loginUserDto);

      expect(result).toEqual(loginResponse);
      expect(mockAuthService.loginUser).toHaveBeenCalledWith(loginUserDto);
    });

    it('debe retornar partialToken cuando el login requiere 2FA', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@u.icesi.edu.co',
        password: 'Test123456',
      };

      const loginResponse = {
        requires2FA: true,
        partialToken: 'partial-token-test',
      };

      mockAuthService.loginUser.mockResolvedValue(loginResponse);

      const result = await controller.login(loginUserDto);

      expect(result).toEqual(loginResponse);
      expect(mockAuthService.loginUser).toHaveBeenCalledWith(loginUserDto);
    });
  });

  describe('perfil', () => {
    it('debe retornar el perfil del usuario autenticado', () => {
      const result = controller.perfil(mockUser);

      expect(result).toEqual({
        mensaje: 'Perfil obtenido correctamente',
        usuario: mockUser,
      });
    });
  });

  describe('dashboardProvider', () => {
    it('debe retornar el panel del proveedor', () => {
      const providerUser = {
        ...mockUser,
        roles: [AppRoles.PROVIDER],
      };

      const result = controller.dashboardProvider(providerUser);

      expect(result).toEqual({
        mensaje: 'Panel del proveedor',
        usuario: providerUser,
      });
    });
  });

  describe('dashboardClient', () => {
    it('debe retornar el panel del cliente', () => {
      const result = controller.dashboardClient(mockUser);

      expect(result).toEqual({
        mensaje: 'Panel del cliente',
        usuario: mockUser,
      });
    });
  });

  describe('marketplace', () => {
    it('debe retornar acceso al marketplace', () => {
      const result = controller.marketplace(mockUser);

      expect(result).toEqual({
        mensaje: 'Marketplace disponible',
        roles: mockUser.roles,
      });
    });
  });

  describe('logout', () => {
    it('debe cerrar sesión correctamente', async () => {
      const logoutResponse = {
        mensaje: 'Sesión cerrada correctamente',
      };

      mockAuthService.logout.mockResolvedValue(logoutResponse);

      const result = await controller.logout(mockUser);

      expect(result).toEqual(logoutResponse);
      expect(mockAuthService.logout).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('generar2fa', () => {
    it('debe llamar a authService.generar2faSecret y retornar el QR', async () => {
      const response = {
        qrCode: 'data:image/png;base64,QR',
      };

      mockAuthService.generar2faSecret.mockResolvedValue(response);

      const result = await controller.generar2fa(mockUser);

      expect(result).toEqual(response);
      expect(mockAuthService.generar2faSecret).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('habilitar2fa', () => {
    it('debe llamar a authService.habilitar2fa y retornar mensaje de éxito', async () => {
      const body = { token: '123456' };
      const response = {
        mensaje: '2FA habilitado correctamente',
      };

      mockAuthService.habilitar2fa.mockResolvedValue(response);

      const result = await controller.habilitar2fa(mockUser, body);

      expect(result).toEqual(response);
      expect(mockAuthService.habilitar2fa).toHaveBeenCalledWith(
        mockUser,
        body.token,
      );
    });
  });

  describe('verificar2fa', () => {
    it('debe llamar a authService.verificar2fa y retornar JWT completo', async () => {
      const body = { token: '123456' };
      const response = {
        usuario: {
          id: mockUser.id,
          nombre: mockUser.name,
          correo: mockUser.email,
          roles: mockUser.roles,
        },
        token: 'jwt-token-test',
      };

      mockAuthService.verificar2fa.mockResolvedValue(response);

      const result = await controller.verificar2fa(mockUser, body);

      expect(result).toEqual(response);
      expect(mockAuthService.verificar2fa).toHaveBeenCalledWith(
        mockUser,
        body.token,
      );
    });
  });
});
