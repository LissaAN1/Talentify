import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { AppRoles } from './interfaces/app-roles';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: { create: ReturnType<typeof vi.fn> };

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
    mockUsersService = {
      create: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
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
});
