import { NotFoundException } from '@nestjs/common';
import type { Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';

import { AppRoles } from '../auth/interfaces/app-roles';
import { User } from '../users/entities/user.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import {
  Service,
  ServiceCategory,
  ServiceStatus,
} from './entities/service.entity';
import { ServicesService } from './services.service';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-uuid-1',
    name: 'Provider Demo',
    email: 'provider@u.icesi.edu.co',
    roles: [AppRoles.PROVIDER],
    isActive: true,
    ...overrides,
  }) as User;

const makeService = (overrides: Partial<Service> = {}): Service => ({
  id: 'service-uuid-1',
  title: 'Logo Design',
  description: 'Professional logo design for your brand.',
  price: 50,
  category: ServiceCategory.DESIGN,
  status: ServiceStatus.ACTIVE,
  provider: makeUser(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, Mock>
>;

const createMockRepository = <
  T extends ObjectLiteral,
>(): MockRepository<T> => ({
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
});

describe('ServicesService', () => {
  let service: ServicesService;
  let repo: MockRepository<Service>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useValue: createMockRepository<Service>(),
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    repo = module.get<MockRepository<Service>>(getRepositoryToken(Service));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  //getOneById
  describe('getOneById', () => {
    it('should return a service when it exists', async () => {
      const mockService = makeService();
      repo.findOne!.mockResolvedValue(mockService);

      const result = await service.getOneById('service-uuid-1');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'service-uuid-1' },
      });
      expect(result).toEqual(mockService);
    });

    it('should throw NotFoundException when service does not exist', async () => {
      repo.findOne!.mockResolvedValue(null);

      await expect(service.getOneById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  //create
  describe('create', () => {
    it('should create and return a new service', async () => {
      const provider = makeUser();
      const dto: CreateServiceDto = {
        title: 'Logo Design',
        description: 'Professional logo design for your brand.',
        price: 50,
        category: ServiceCategory.DESIGN,
      };
      const createdService = makeService({ provider });

      repo.create!.mockReturnValue(createdService);
      repo.save!.mockResolvedValue(createdService);

      const result = await service.create(provider, dto);

      expect(repo.create).toHaveBeenCalledWith({
        ...dto,
        provider,
        status: ServiceStatus.ACTIVE,
      });
      expect(repo.save).toHaveBeenCalledWith(createdService);
      expect(result).toEqual(createdService);
    });
  });
});
