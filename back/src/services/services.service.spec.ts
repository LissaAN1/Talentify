import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';

import { AppRoles } from '../auth/interfaces/app-roles';
import { User } from '../users/entities/user.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
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

  //getByProvider
  describe('getByProvider', () => {
    it('should return all services for a given provider', async () => {
      const services = [
        makeService(),
        makeService({ id: 'service-uuid-2', status: ServiceStatus.INACTIVE }),
      ];
      repo.find!.mockResolvedValue(services);

      const result = await service.getByProvider('user-uuid-1');

      expect(repo.find).toHaveBeenCalledWith({
        where: { provider: { id: 'user-uuid-1' } },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when provider has no services', async () => {
      repo.find!.mockResolvedValue([]);

      const result = await service.getByProvider('user-without-services');

      expect(repo.find).toHaveBeenCalledWith({
        where: { provider: { id: 'user-without-services' } },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([]);
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

  //update
  describe('update', () => {
    it('should allow a PROVIDER to update their own service', async () => {
      const provider = makeUser();
      const mockService = makeService({ provider });
      const dto: UpdateServiceDto = { title: 'Updated Title' };
      const updatedService = { ...mockService, ...dto };

      repo.findOne!.mockResolvedValue(mockService);
      repo.save!.mockResolvedValue(updatedService);

      const result = await service.update('service-uuid-1', dto, provider);

      expect(result.title).toBe('Updated Title');
    });

    it('should allow an ADMIN to update any service', async () => {
      const admin = makeUser({ id: 'admin-uuid', roles: [AppRoles.ADMIN] });
      const mockService = makeService(); // owned by provider, not admin
      const dto: UpdateServiceDto = { status: ServiceStatus.INACTIVE };
      const updatedService = { ...mockService, ...dto };

      repo.findOne!.mockResolvedValue(mockService);
      repo.save!.mockResolvedValue(updatedService);

      const result = await service.update('service-uuid-1', dto, admin);

      expect(result.status).toBe(ServiceStatus.INACTIVE);
    });

    it('should throw ForbiddenException when PROVIDER tries to update another user service', async () => {
      const otherProvider = makeUser({ id: 'other-uuid' });
      const mockService = makeService(); // owned by 'user-uuid-1'

      repo.findOne!.mockResolvedValue(mockService);

      await expect(
        service.update('service-uuid-1', { title: 'Hacked' }, otherProvider),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when PROVIDER tries to change status', async () => {
      const provider = makeUser();
      const mockService = makeService({ provider });

      repo.findOne!.mockResolvedValue(mockService);

      await expect(
        service.update(
          'service-uuid-1',
          { status: ServiceStatus.INACTIVE },
          provider,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when service does not exist', async () => {
      repo.findOne!.mockResolvedValue(null);

      await expect(
        service.update('non-existent', {}, makeUser()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should save the merged service data when PROVIDER updates their own service without changing status', async () => {
      const provider = makeUser();
      const mockService = makeService({ provider });
      const dto: UpdateServiceDto = {
        title: 'Updated Title',
        description: 'Updated Description',
        price: 75,
      };
      const updatedService = { ...mockService, ...dto };

      repo.findOne!.mockResolvedValue(mockService);
      repo.save!.mockResolvedValue(updatedService);

      const result = await service.update('service-uuid-1', dto, provider);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
          description: 'Updated Description',
          price: 75,
          status: ServiceStatus.ACTIVE,
        }),
      );
      expect(result).toEqual(updatedService);
    });

    it('should allow ADMIN to update fields without changing status', async () => {
      const admin = makeUser({ id: 'admin-uuid', roles: [AppRoles.ADMIN] });
      const mockService = makeService();
      const dto: UpdateServiceDto = {
        title: 'Admin Updated Title',
      };
      const updatedService = { ...mockService, ...dto };

      repo.findOne!.mockResolvedValue(mockService);
      repo.save!.mockResolvedValue(updatedService);

      const result = await service.update('service-uuid-1', dto, admin);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Admin Updated Title',
        }),
      );
      expect(result.title).toBe('Admin Updated Title');
    });

    it('should not call save when PROVIDER tries to update another user service', async () => {
      const otherProvider = makeUser({ id: 'other-uuid' });
      const mockService = makeService();

      repo.findOne!.mockResolvedValue(mockService);

      await expect(
        service.update('service-uuid-1', { title: 'Hacked' }, otherProvider),
      ).rejects.toThrow(ForbiddenException);

      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should not call save when PROVIDER tries to change status', async () => {
      const provider = makeUser();
      const mockService = makeService({ provider });

      repo.findOne!.mockResolvedValue(mockService);

      await expect(
        service.update(
          'service-uuid-1',
          { status: ServiceStatus.INACTIVE },
          provider,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  //delete
  describe('delete', () => {
    it('should soft-delete a service (set status INACTIVE) when owner calls it', async () => {
      const provider = makeUser();
      const mockService = makeService({ provider });
      const deactivated = { ...mockService, status: ServiceStatus.INACTIVE };

      repo.findOne!.mockResolvedValue(mockService);
      repo.save!.mockResolvedValue(deactivated);

      const result = await service.delete('service-uuid-1', provider);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ServiceStatus.INACTIVE }),
      );
      expect(result.status).toBe(ServiceStatus.INACTIVE);
    });

    it('should allow ADMIN to delete any service', async () => {
      const admin = makeUser({ id: 'admin-uuid', roles: [AppRoles.ADMIN] });
      const mockService = makeService(); // owned by different provider
      const deactivated = { ...mockService, status: ServiceStatus.INACTIVE };

      repo.findOne!.mockResolvedValue(mockService);
      repo.save!.mockResolvedValue(deactivated);

      const result = await service.delete('service-uuid-1', admin);

      expect(result.status).toBe(ServiceStatus.INACTIVE);
    });

    it('should throw ForbiddenException when PROVIDER tries to delete another user service', async () => {
      const otherProvider = makeUser({ id: 'other-uuid' });
      const mockService = makeService(); // owned by 'user-uuid-1'

      repo.findOne!.mockResolvedValue(mockService);

      await expect(
        service.delete('service-uuid-1', otherProvider),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when service does not exist', async () => {
      repo.findOne!.mockResolvedValue(null);

      await expect(service.delete('non-existent', makeUser())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  it('should not call save when PROVIDER tries to delete another user service', async () => {
    const otherProvider = makeUser({ id: 'other-uuid' });
    const mockService = makeService();

    repo.findOne!.mockResolvedValue(mockService);

    await expect(
      service.delete('service-uuid-1', otherProvider),
    ).rejects.toThrow(ForbiddenException);

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should set service status to INACTIVE before saving it', async () => {
    const provider = makeUser();
    const mockService = makeService({ provider });

    repo.findOne!.mockResolvedValue(mockService);
    repo.save!.mockImplementation(async (serviceToSave) => serviceToSave);

    const result = await service.delete('service-uuid-1', provider);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ServiceStatus.INACTIVE,
      }),
    );
    expect(result.status).toBe(ServiceStatus.INACTIVE);
  });
});
