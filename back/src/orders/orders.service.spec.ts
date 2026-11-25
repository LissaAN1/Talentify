import type { Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';

//Helpers
const USER_ID = '1';
const OTHER_UID = '999';
const ORDER_ID = '2';
const SERVICE_ID = '3';

function makeUser(id: string = USER_ID): User {
  const user = new User();
  user.id = id;
  return user;
}

function makeService(id: string = SERVICE_ID): Service {
  const service = new Service();
  service.id = id;
  return service;
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  const order = new Order();
  order.id = ORDER_ID;
  order.user = makeUser();
  order.service = makeService();
  order.status = OrderStatus.PENDING;
  order.totalAmount = 100;
  order.notes = null;
  order.createdAt = new Date('2024-01-01');
  order.updatedAt = new Date('2024-01-01');
  return Object.assign(order, overrides);
}

//Tests
describe('OrdersService', () => {
  let service: OrdersService;
  let repo: Record<string, Mock>;

  beforeEach(async () => {
    const mockRepo: Record<string, Mock> = {
      create: vi.fn(),
      save: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    repo = module.get(getRepositoryToken(Order));
  });

  //create
  describe('create()', () => {
    const dto: CreateOrderDto = {
      serviceId: SERVICE_ID,
      totalAmount: 150,
      notes: 'Con urgencia',
    };

    it('debe crear y retornar una orden con status PENDING', async () => {
      const built = makeOrder({ totalAmount: 150, notes: 'Con urgencia' });
      const saved = { ...built, id: ORDER_ID };

      repo.create.mockReturnValue(built);
      repo.save.mockResolvedValue(saved);

      const result = await service.create(USER_ID, dto);

      expect(repo.create).toHaveBeenCalledWith({
        totalAmount: 150,
        notes: 'Con urgencia',
        user: { id: USER_ID },
        service: { id: SERVICE_ID },
        status: OrderStatus.PENDING,
      });
      expect(repo.save).toHaveBeenCalledWith(built);
      expect(result.status).toBe(OrderStatus.PENDING);
      expect(result.user.id).toBe(USER_ID);
    });

    it('debe propagar errores del repositorio', async () => {
      repo.create.mockReturnValue(makeOrder());
      repo.save.mockRejectedValue(new Error('DB error'));

      await expect(service.create(USER_ID, dto)).rejects.toThrow('DB error');
    });
  });

  //getById
  describe('getById()', () => {
    it('debe retornar la orden cuando existe y pertenece al usuario', async () => {
      repo.findOne.mockResolvedValue(makeOrder());

      const result = await service.getById(ORDER_ID, USER_ID);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: ORDER_ID },
        relations: { user: true, service: { provider: true } },
      });
      expect(result.id).toBe(ORDER_ID);
    });

    it('debe lanzar NotFoundException cuando la orden no existe', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.getById(ORDER_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar ForbiddenException cuando la orden pertenece a otro usuario', async () => {
      repo.findOne.mockResolvedValue(makeOrder({ user: makeUser(OTHER_UID) }));

      await expect(service.getById(ORDER_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
