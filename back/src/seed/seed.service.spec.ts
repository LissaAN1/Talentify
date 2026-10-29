import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Order } from '../orders/entities/order.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { seedOrders, seedServices, seedUsers } from './data/seed-data';
import { SeedService } from './seed.service';

vi.mock('bcrypt', () => ({
  hashSync: vi.fn(),
}));

describe('SeedService', () => {
  let service: SeedService;

  // "Base de datos" en memoria para simular los repositorios
  let users: any[];
  let services: any[];
  let orders: any[];

  let mockUserRepository: any;
  let mockServiceRepository: any;
  let mockOrderRepository: any;

  const hashedPassword = 'hashed-password';

  const buildRepositories = () => {
    mockUserRepository = {
      findOne: vi.fn(async ({ where }: { where: any }) => {
        return users.find((u) => u.email === where.email) ?? null;
      }),
      create: vi.fn((data: any) => ({ ...data })),
      save: vi.fn(async (user: any) => {
        const saved = { id: `user-${users.length + 1}`, ...user };
        users.push(saved);
        return saved;
      }),
    };

    mockServiceRepository = {
      findOne: vi.fn(async ({ where }: { where: any }) => {
        return services.find((s) => s.title === where.title) ?? null;
      }),
      create: vi.fn((data: any) => ({ ...data })),
      save: vi.fn(async (item: any) => {
        const saved = { id: `service-${services.length + 1}`, ...item };
        services.push(saved);
        return saved;
      }),
    };

    mockOrderRepository = {
      findOne: vi.fn(async ({ where }: { where: any }) => {
        return (
          orders.find(
            (o) =>
              o.user.id === where.user.id &&
              o.service.id === where.service.id,
          ) ?? null
        );
      }),
      create: vi.fn((data: any) => ({ ...data })),
      save: vi.fn(async (order: any) => {
        const saved = { id: `order-${orders.length + 1}`, ...order };
        orders.push(saved);
        return saved;
      }),
    };
  };

  beforeEach(async () => {
    users = [];
    services = [];
    orders = [];

    vi.clearAllMocks();
    vi.mocked(bcrypt.hashSync).mockReturnValue(hashedPassword);

    buildRepositories();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(Service),
          useValue: mockServiceRepository,
        },
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería ejecutar la carga inicial al arrancar la aplicación', async () => {
    const runSeedSpy = vi.spyOn(service, 'runSeed').mockResolvedValue(undefined);

    await service.onApplicationBootstrap();

    expect(runSeedSpy).toHaveBeenCalledTimes(1);
  });

  it('debería crear usuarios, servicios y órdenes en la primera ejecución', async () => {
    await service.runSeed();

    expect(mockUserRepository.save).toHaveBeenCalledTimes(seedUsers.length);
    expect(mockServiceRepository.save).toHaveBeenCalledTimes(
      seedServices.length,
    );
    expect(mockOrderRepository.save).toHaveBeenCalledTimes(seedOrders.length);

    expect(users).toHaveLength(3);
    expect(services).toHaveLength(3);
    expect(orders).toHaveLength(3);
  });

  it('debería crear un usuario por cada rol', async () => {
    await service.runSeed();

    const roles = users.flatMap((u) => u.roles);

    expect(roles).toEqual(
      expect.arrayContaining(['ADMIN', 'PROVIDER', 'CLIENT']),
    );
  });

  it('no debería duplicar datos si se ejecuta dos veces', async () => {
    await service.runSeed();
    await service.runSeed();

    expect(users).toHaveLength(seedUsers.length);
    expect(services).toHaveLength(seedServices.length);
    expect(orders).toHaveLength(seedOrders.length);

    expect(mockUserRepository.save).toHaveBeenCalledTimes(seedUsers.length);
    expect(mockServiceRepository.save).toHaveBeenCalledTimes(
      seedServices.length,
    );
    expect(mockOrderRepository.save).toHaveBeenCalledTimes(seedOrders.length);
  });

  it('debería evitar crear entidades que ya existen', async () => {
    mockUserRepository.findOne.mockResolvedValue({
      id: 'uuid-user-existente',
      email: 'admin@u.icesi.edu.co',
    });

    mockServiceRepository.findOne.mockResolvedValue({
      id: 'uuid-service-existente',
      title: 'Diseño de logo profesional',
    });

    mockOrderRepository.findOne.mockResolvedValue({
      id: 'uuid-order-existente',
    });

    await service.runSeed();

    expect(mockUserRepository.create).not.toHaveBeenCalled();
    expect(mockUserRepository.save).not.toHaveBeenCalled();

    expect(mockServiceRepository.create).not.toHaveBeenCalled();
    expect(mockServiceRepository.save).not.toHaveBeenCalled();

    expect(mockOrderRepository.create).not.toHaveBeenCalled();
    expect(mockOrderRepository.save).not.toHaveBeenCalled();
  });

  it('debería encriptar la contraseña antes de guardar el usuario', async () => {
    await service.runSeed();

    const usuarioCreado = mockUserRepository.create.mock.calls[0][0];

    expect(bcrypt.hashSync).toHaveBeenCalledWith('Admin12345', 10);
    expect(usuarioCreado.password).toBe(hashedPassword);
    expect(usuarioCreado.password).not.toBe('Admin12345');
  });

  it('debería asociar cada servicio con su proveedor', async () => {
    await service.runSeed();

    for (const item of services) {
      expect(item.provider).toBeDefined();
      expect(item.provider.email).toBe('provider@u.icesi.edu.co');
    }
  });

  it('debería asociar cada orden con su cliente y su servicio', async () => {
    await service.runSeed();

    for (const order of orders) {
      expect(order.user.email).toBe('client@u.icesi.edu.co');
      expect(order.service).toBeDefined();
    }
  });
});