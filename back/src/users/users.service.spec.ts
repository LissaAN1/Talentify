import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';

import { AppRoles } from '../auth/interfaces/app-roles';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: {
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
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
    mockRepository = {
      find: vi.fn(),
      findOne: vi.fn(),
      findOneBy: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAll', () => {
    it('should return an array of users', async () => {
      const users: User[] = [user];

      mockRepository.find.mockResolvedValue(users);

      const result = await service.getAll();

      expect(result).toEqual(users);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getOneById', () => {
    it('should return a user by id', async () => {
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.getOneById('1');

      expect(result).toEqual(user);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', isActive: true },
      });
    });

    it('should throw NotFoundException when user id does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getOneById('1')).rejects.toThrow(NotFoundException);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', isActive: true },
      });
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Juan Pérez',
        email: 'juan@u.icesi.edu.co',
        password: 'Password123',
      };

      const hashedPassword = 'hashed-password';

      const createdUser = {
        ...createUserDto,
        password: hashedPassword,
        roles: [AppRoles.CLIENT],
        isActive: true,
        refreshToken: null,
      };

      const savedUser: User = {
        ...user,
        password: hashedPassword,
      };

      mockRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(savedUser);

      mockRepository.create.mockReturnValue(createdUser);
      mockRepository.save.mockResolvedValue(savedUser);

      vi.mocked(
        bcrypt.hash as (...a: unknown[]) => Promise<string>,
      ).mockResolvedValue(hashedPassword);

      const result = await service.create(createUserDto);

      expect(result).toEqual(savedUser);

      expect(mockRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { email: createUserDto.email },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
        roles: [AppRoles.CLIENT],
        isActive: true,
        refreshToken: null,
      });

      expect(mockRepository.save).toHaveBeenCalledWith(createdUser);

      expect(mockRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { id: savedUser.id, isActive: true },
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Juan Pérez',
        email: 'juan@u.icesi.edu.co',
        password: 'Password123',
      };

      mockRepository.findOne.mockResolvedValue(user);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });

      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a user without changing password', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Juan Actualizado',
      };

      const updatedUser: User = {
        ...user,
        name: updateUserDto.name!,
      };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(updatedUser);

      const result = await service.update('1', updateUserDto);

      expect(result).toEqual(updatedUser);

      expect(mockRepository.update).toHaveBeenCalledWith('1', updateUserDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', isActive: true },
      });
    });

    it('should update a user and hash the new password', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Juan Actualizado',
        password: 'NewPassword123',
      };

      const hashedPassword = 'new-hashed-password';

      const updatedUser: User = {
        ...user,
        name: updateUserDto.name!,
        password: hashedPassword,
      };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(updatedUser);

      vi.mocked(
        bcrypt.hash as (...a: unknown[]) => Promise<string>,
      ).mockResolvedValue(hashedPassword);

      const result = await service.update('1', updateUserDto);

      expect(result).toEqual(updatedUser);

      expect(bcrypt.hash).toHaveBeenCalledWith(updateUserDto.password, 10);

      expect(mockRepository.update).toHaveBeenCalledWith('1', {
        name: updateUserDto.name,
        password: hashedPassword,
      });

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', isActive: true },
      });
    });

    it('should throw NotFoundException when user to update does not exist', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Usuario Inexistente',
      };

      mockRepository.update.mockResolvedValue({ affected: 0 });

      await expect(service.update('1', updateUserDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockRepository.update).toHaveBeenCalledWith('1', updateUserDto);
      expect(mockRepository.findOne).not.toHaveBeenCalled();
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

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(updatedUser);

      const result = await service.updateRoles('1', updateUserRolesDto);

      expect(result).toEqual(updatedUser);

      expect(mockRepository.update).toHaveBeenCalledWith('1', {
        roles: updateUserRolesDto.roles,
      });

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', isActive: true },
      });
    });

    it('should throw NotFoundException when user to update roles does not exist', async () => {
      const updateUserRolesDto: UpdateUserRolesDto = {
        roles: [AppRoles.ADMIN],
      };

      mockRepository.update.mockResolvedValue({ affected: 0 });

      await expect(
        service.updateRoles('1', updateUserRolesDto),
      ).rejects.toThrow(NotFoundException);

      expect(mockRepository.update).toHaveBeenCalledWith('1', {
        roles: updateUserRolesDto.roles,
      });

      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should deactivate a user', async () => {
      const inactiveUser: User = {
        ...user,
        isActive: false,
      };

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.save.mockResolvedValue(inactiveUser);

      const result = await service.delete('1');

      expect(result).toEqual(inactiveUser);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', isActive: true },
      });

      expect(mockRepository.save).toHaveBeenCalledWith({
        ...user,
        isActive: false,
      });
    });

    it('should throw NotFoundException when user to delete does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('1')).rejects.toThrow(NotFoundException);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', isActive: true },
      });

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
