import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';

import { AppRoles } from '../auth/interfaces/app-roles';
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
});
