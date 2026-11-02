import type { Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

import { AppRoles } from '../auth/interfaces/app-roles';
import { User } from '../users/entities/user.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import {
  Service,
  ServiceCategory,
  ServiceStatus,
} from './entities/service.entity';
import { ServicesController } from './services.controller';
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

const mockServicesService = {
  getAll: vi.fn(),
  getOneById: vi.fn(),
  getByProvider: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

describe('ServicesController', () => {
  let controller: ServicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [{ provide: ServicesService, useValue: mockServicesService }],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  //getMyServices
  describe('getMyServices', () => {
    it('should call getByProvider with the authenticated user id', async () => {
      const provider = makeUser();
      const services = [makeService({ provider })];
      mockServicesService.getByProvider.mockResolvedValue(services);

      const result = await controller.getMyServices(provider);

      expect(mockServicesService.getByProvider).toHaveBeenCalledWith(
        provider.id,
      );
      expect(result).toEqual(services);
    });
  });

  //create
  describe('create', () => {
    it('should call create with the user and DTO', async () => {
      const provider = makeUser();
      const dto: CreateServiceDto = {
        title: 'Logo Design',
        description: 'Professional logo design.',
        price: 50,
        category: ServiceCategory.DESIGN,
      };
      const createdService = makeService({ provider });
      mockServicesService.create.mockResolvedValue(createdService);

      const result = await controller.create(provider, dto);

      expect(mockServicesService.create).toHaveBeenCalledWith(provider, dto);
      expect(result).toEqual(createdService);
    });
  });

  //update
  describe('update', () => {
    it('should call update with id, dto, and user', async () => {
      const provider = makeUser();
      const dto: UpdateServiceDto = { title: 'Updated Title' };
      const updatedService = makeService({ title: 'Updated Title' });
      mockServicesService.update.mockResolvedValue(updatedService);

      const result = await controller.update('service-uuid-1', dto, provider);

      expect(mockServicesService.update).toHaveBeenCalledWith(
        'service-uuid-1',
        dto,
        provider,
      );
      expect(result).toEqual(updatedService);
    });
  });

  //delete
  describe('delete', () => {
    it('should call delete with id and user', async () => {
      const provider = makeUser();
      const deactivated = makeService({ status: ServiceStatus.INACTIVE });
      mockServicesService.delete.mockResolvedValue(deactivated);

      const result = await controller.delete('service-uuid-1', provider);

      expect(mockServicesService.delete).toHaveBeenCalledWith(
        'service-uuid-1',
        provider,
      );
      expect(result.status).toBe(ServiceStatus.INACTIVE);
    });
  });
});
