import type { Mock } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';

import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { AppRoles } from './interfaces/app-roles';

import { TwoFactorAuthService } from './two-factor-auth.service';

vi.mock('bcrypt', () => ({
  compareSync: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: Record<string, Mock>;
  let mockUsersService: Record<string, Mock>;
  let mockJwtService: Record<string, Mock>;
  let mockTwoFactorAuthService: Record<string, Mock>;

  const mockUser: User = {
    id: '1',
    name: 'Usuario Test',
    email: 'test@u.icesi.edu.co',
    password: 'hashed-password',
    roles: [AppRoles.CLIENT],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    refreshToken: null,
    isTwoFactorEnabled: false,
    twoFactorSecret: undefined,
  };

  const mockQueryBuilder = (result: User | null) => {
    const queryBuilder = {
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getOne: vi.fn().mockResolvedValue(result),
    };

    mockUserRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    return queryBuilder;
  };

  beforeEach(async () => {
    mockUserRepository = {
      findOne: vi.fn(),
      update: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    mockUsersService = {
      create: vi.fn(),
    };

    mockJwtService = {
      sign: vi.fn(),
    };

    mockTwoFactorAuthService = {
      generateSecret: vi.fn(),
      generateQrCodeDataUrl: vi.fn(),
      verifyToken: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: TwoFactorAuthService,
          useValue: mockTwoFactorAuthService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('debe registrar un usuario como CLIENT usando UsersService', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Usuario Test',
        email: 'test@u.icesi.edu.co',
        password: 'Test123456',
        roles: [AppRoles.ADMIN],
      };

      mockUsersService.create.mockResolvedValue({
        ...mockUser,
        roles: [AppRoles.CLIENT],
      });

      const result = await service.createUser(createUserDto);

      expect(result.roles).toEqual([AppRoles.CLIENT]);

      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...createUserDto,
        roles: [AppRoles.CLIENT],
      });
    });

    it('debe fallar si el correo ya existe', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Usuario Test',
        email: 'test@u.icesi.edu.co',
        password: 'Test123456',
      };

      mockUsersService.create.mockRejectedValue(
        new ConflictException('Ya existe un usuario registrado con ese correo'),
      );

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe lanzar BadRequestException si UsersService lanza un error inesperado', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Usuario Test',
        email: 'test@u.icesi.edu.co',
        password: 'Test123456',
      };

      mockUsersService.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('loginUser', () => {
    it('debe iniciar sesión correctamente y retornar usuario con token JWT', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@u.icesi.edu.co',
        password: 'Test123456',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compareSync as Mock).mockReturnValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token-test');

      const result = await service.loginUser(loginUserDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          email: loginUserDto.email,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          roles: true,
          isTwoFactorEnabled: true,
        },
      });

      expect(bcrypt.compareSync).toHaveBeenCalledWith(
        loginUserDto.password,
        mockUser.password,
      );

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        user_id: mockUser.id,
      });

      expect(result).toEqual({
        usuario: {
          id: mockUser.id,
          nombre: mockUser.name,
          correo: mockUser.email,
          roles: mockUser.roles,
        },
        token: 'jwt-token-test',
      });
    });

    it('debe retornar partialToken cuando el usuario tiene 2FA activo', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@u.icesi.edu.co',
        password: 'Test123456',
      };

      const userWith2fa = {
        ...mockUser,
        isTwoFactorEnabled: true,
      };

      mockUserRepository.findOne.mockResolvedValue(userWith2fa);
      (bcrypt.compareSync as Mock).mockReturnValue(true);
      mockJwtService.sign.mockReturnValue('partial-token-test');

      const result = await service.loginUser(loginUserDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { user_id: mockUser.id, is2FAPending: true },
        { expiresIn: '5m' },
      );

      expect(result).toEqual({
        requires2FA: true,
        partialToken: 'partial-token-test',
      });
    });

    it('debe fallar si el usuario no existe', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'noexiste@u.icesi.edu.co',
        password: 'Test123456',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.loginUser(loginUserDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(bcrypt.compareSync).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('debe fallar si la contraseña es inválida', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@u.icesi.edu.co',
        password: 'WrongPassword123',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compareSync as Mock).mockReturnValue(false);

      await expect(service.loginUser(loginUserDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si ocurre un error inesperado durante el login', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@u.icesi.edu.co',
        password: 'Test123456',
      };

      mockUserRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.loginUser(loginUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('generar2faSecret', () => {
    it('debe generar el QR 2FA y guardar el secret del usuario', async () => {
      mockTwoFactorAuthService.generateSecret.mockReturnValue({
        base32: 'SECRET_BASE32',
        otpauth_url: 'otpauth://totp/Talentify',
      });
      mockTwoFactorAuthService.generateQrCodeDataUrl.mockResolvedValue(
        'data:image/png;base64,QR',
      );
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.generar2faSecret(mockUser);

      expect(mockTwoFactorAuthService.generateSecret).toHaveBeenCalledWith(
        mockUser.email,
      );
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        twoFactorSecret: 'SECRET_BASE32',
      });
      expect(
        mockTwoFactorAuthService.generateQrCodeDataUrl,
      ).toHaveBeenCalledWith('otpauth://totp/Talentify');
      expect(result).toEqual({ qrCode: 'data:image/png;base64,QR' });
    });

    it('debe lanzar BadRequestException si no se genera la URL del QR', async () => {
      mockTwoFactorAuthService.generateSecret.mockReturnValue({
        base32: 'SECRET_BASE32',
      });
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      await expect(service.generar2faSecret(mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('habilitar2fa', () => {
    it('debe habilitar 2FA cuando el código es válido', async () => {
      mockQueryBuilder({
        ...mockUser,
        twoFactorSecret: 'SECRET_BASE32',
      });

      mockTwoFactorAuthService.verifyToken.mockReturnValue(true);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.habilitar2fa(mockUser, '123456');

      expect(mockTwoFactorAuthService.verifyToken).toHaveBeenCalledWith(
        'SECRET_BASE32',
        '123456',
      );
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        isTwoFactorEnabled: true,
      });
      expect(result).toEqual({ mensaje: '2FA habilitado correctamente' });
    });

    it('debe lanzar BadRequestException si no existe secret 2FA', async () => {
      mockQueryBuilder({
        ...mockUser,
        twoFactorSecret: undefined,
      });

      await expect(service.habilitar2fa(mockUser, '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar UnauthorizedException si el código 2FA es inválido', async () => {
      mockQueryBuilder({
        ...mockUser,
        twoFactorSecret: 'SECRET_BASE32',
      });

      mockTwoFactorAuthService.verifyToken.mockReturnValue(false);

      await expect(service.habilitar2fa(mockUser, '000000')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('verificar2fa', () => {
    it('debe verificar 2FA y retornar JWT completo cuando el código es válido', async () => {
      mockQueryBuilder({
        ...mockUser,
        twoFactorSecret: 'SECRET_BASE32',
      });

      mockTwoFactorAuthService.verifyToken.mockReturnValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token-test');

      const result = await service.verificar2fa(mockUser, '123456');

      expect(mockTwoFactorAuthService.verifyToken).toHaveBeenCalledWith(
        'SECRET_BASE32',
        '123456',
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        user_id: mockUser.id,
      });
      expect(result).toEqual({
        usuario: {
          id: mockUser.id,
          nombre: mockUser.name,
          correo: mockUser.email,
          roles: mockUser.roles,
        },
        token: 'jwt-token-test',
      });
    });

    it('debe lanzar BadRequestException si el usuario no tiene 2FA configurado', async () => {
      mockQueryBuilder({
        ...mockUser,
        twoFactorSecret: undefined,
      });

      await expect(service.verificar2fa(mockUser, '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar UnauthorizedException si el código de verificación 2FA es inválido', async () => {
      mockQueryBuilder({
        ...mockUser,
        twoFactorSecret: 'SECRET_BASE32',
      });

      mockTwoFactorAuthService.verifyToken.mockReturnValue(false);

      await expect(service.verificar2fa(mockUser, '000000')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('debe cerrar sesión correctamente', async () => {
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.logout(mockUser.id);

      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        refreshToken: null,
      });
      expect(result).toEqual({
        mensaje: 'Sesión cerrada correctamente',
      });
    });
  });
});
