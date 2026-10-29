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

vi.mock('bcrypt', () => ({
  compareSync: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: {
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let mockUsersService: { create: ReturnType<typeof vi.fn> };
  let mockJwtService: { sign: ReturnType<typeof vi.fn> };

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

  beforeEach(async () => {
    mockUserRepository = {
      findOne: vi.fn(),
      update: vi.fn(),
    };

    mockUsersService = {
      create: vi.fn(),
    };

    mockJwtService = {
      sign: vi.fn(),
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
        new ConflictException('El correo ya está registrado'),
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
    const loginUserDto: LoginUserDto = {
      email: 'test@u.icesi.edu.co',
      password: 'Test123456',
    };

    it('debe iniciar sesión correctamente y retornar usuario con token JWT', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compareSync).mockReturnValue(true);
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

    it('debe fallar si el usuario no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.loginUser(loginUserDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(bcrypt.compareSync).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('debe fallar si la contraseña es incorrecta', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compareSync).mockReturnValue(false);

      await expect(service.loginUser(loginUserDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('debe limpiar el refreshToken del usuario', async () => {
      mockUserRepository.update.mockResolvedValue(undefined);

      const result = await service.logout(mockUser.id);

      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        refreshToken: null,
      });
      expect(result).toEqual({ mensaje: 'Sesión cerrada correctamente' });
    });
  });
});
