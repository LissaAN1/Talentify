import { Test, TestingModule } from '@nestjs/testing';

import { AppRoles } from '../auth/interfaces/app-roles';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: {
    getAll: ReturnType<typeof vi.fn>;
    getOneById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateRoles: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const user: User = {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan@u.icesi.edu.co',
    password: 'hashed-password',
    roles: [AppRoles.CLIENT],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    refreshToken: null,
  };

  beforeEach(async () => {
    mockUsersService = {
      getAll: vi.fn(),
      getOneById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateRoles: vi.fn(),
      delete: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return a user by id', async () => {
      mockUsersService.getOneById.mockResolvedValue(user);

      const result = await controller.getProfile('1');

      expect(result).toEqual(user);
      expect(mockUsersService.getOneById).toHaveBeenCalledWith('1');
    });
  });

  describe('updateProfile', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Juan Actualizado',
      };

      const updatedUser: User = {
        ...user,
        name: updateUserDto.name!,
      };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile('1', updateUserDto);

      expect(result).toEqual(updatedUser);

      expect(mockUsersService.update).toHaveBeenCalledWith('1', updateUserDto);
    });
  });

  describe('getAll', () => {
    it('should return an array of users', async () => {
      const users: User[] = [user];

      mockUsersService.getAll.mockResolvedValue(users);

      const result = await controller.getAll();

      expect(result).toEqual(users);
      expect(mockUsersService.getAll).toHaveBeenCalled();
    });
  });

  describe('getOneById', () => {
    it('should return a user by id', async () => {
      mockUsersService.getOneById.mockResolvedValue(user);

      const result = await controller.getOneById('1');

      expect(result).toEqual(user);
      expect(mockUsersService.getOneById).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Juan Pérez',
        email: 'juan@u.icesi.edu.co',
        password: 'Password123',
      };

      mockUsersService.create.mockResolvedValue(user);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(user);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Juan Actualizado',
      };

      const updatedUser: User = {
        ...user,
        name: updateUserDto.name!,
      };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('1', updateUserDto);

      expect(result).toEqual(updatedUser);

      expect(mockUsersService.update).toHaveBeenCalledWith('1', updateUserDto);
    });
  });

  describe('updateRoles', () => {
    it('should update user roles', async () => {
      const updateUserRolesDto: UpdateUserRolesDto = {
        roles: [AppRoles.CLIENT, AppRoles.PROVIDER],
      };

      const updatedUser: User = {
        ...user,
        roles: updateUserRolesDto.roles,
      };

      mockUsersService.updateRoles.mockResolvedValue(updatedUser);

      const result = await controller.updateRoles('1', updateUserRolesDto);

      expect(result).toEqual(updatedUser);

      expect(mockUsersService.updateRoles).toHaveBeenCalledWith(
        '1',
        updateUserRolesDto,
      );
    });
  });

  describe('delete', () => {
    it('should deactivate a user', async () => {
      const inactiveUser: User = {
        ...user,
        isActive: false,
      };

      mockUsersService.delete.mockResolvedValue(inactiveUser);

      const result = await controller.delete('1');

      expect(result).toEqual(inactiveUser);
      expect(mockUsersService.delete).toHaveBeenCalledWith('1');
    });
  });
});
