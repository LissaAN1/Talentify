import type { Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';

//Helpers
const USER_ID = '1';
const ORDER_ID = '2';
const SERVICE_ID = '3';
const MOCK_USER = { id: USER_ID, email: 'juan@u.icesi.edu.co' };

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
describe('OrdersController', () => {
  let controller: OrdersController;
  let service: Record<string, Mock>;

  const mockService: Record<string, Mock> = {
    create: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    getByProvider: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: mockService }],
    })
      .overrideGuard(AuthGuard())
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get(OrdersService);

    vi.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  //create
  describe('create()', () => {
    it('debe llamar a service.create con el userId del token y el DTO', async () => {
      const dto: CreateOrderDto = { serviceId: SERVICE_ID, totalAmount: 150 };
      const order = makeOrder({ totalAmount: 150 });

      service.create.mockResolvedValue(order);

      const result = await controller.create(MOCK_USER, dto);

      expect(service.create).toHaveBeenCalledWith(USER_ID, dto);
      expect(result).toEqual(order);
    });

    it('debe retornar la orden con status PENDING recién creada', async () => {
      const dto: CreateOrderDto = { serviceId: SERVICE_ID, totalAmount: 200 };
      const order = makeOrder({ status: OrderStatus.PENDING });

      service.create.mockResolvedValue(order);

      const result = await controller.create(MOCK_USER, dto);

      expect(result.status).toBe(OrderStatus.PENDING);
    });
  });

  //getAll
  describe('getAll()', () => {
    it('debe llamar a service.getAll con el userId del token', async () => {
      const orders = [makeOrder(), makeOrder({ id: 'order-uuid-002' })];
      service.getAll.mockResolvedValue(orders);

      const result = await controller.getAll(MOCK_USER);

      expect(service.getAll).toHaveBeenCalledWith(USER_ID);
      expect(result).toHaveLength(2);
    });

    it('debe retornar arreglo vacío si no hay órdenes', async () => {
      service.getAll.mockResolvedValue([]);

      const result = await controller.getAll(MOCK_USER);

      expect(result).toEqual([]);
    });
  });

  // getProviderOrders
  describe('getProviderOrders()', () => {
    it('debe llamar a service.getByProvider con el userId del token', async () => {
      const orders = [makeOrder(), makeOrder({ id: 'order-uuid-002' })];

      service.getByProvider.mockResolvedValue(orders);

      const result = await controller.getProviderOrders(MOCK_USER);

      expect(service.getByProvider).toHaveBeenCalledWith(USER_ID);
      expect(result).toHaveLength(2);
    });

    it('debe retornar arreglo vacío si el proveedor no tiene órdenes recibidas', async () => {
      service.getByProvider.mockResolvedValue([]);

      const result = await controller.getProviderOrders(MOCK_USER);

      expect(result).toEqual([]);
    });
  });

  //getById
  describe('getById()', () => {
    it('debe llamar a service.getById con orderId y el usuario', async () => {
      const order = makeOrder();
      service.getById.mockResolvedValue(order);

      const result = await controller.getById(ORDER_ID, MOCK_USER);

      expect(service.getById).toHaveBeenCalledWith(ORDER_ID, MOCK_USER);
      expect(result).toEqual(order);
    });

    it('debe propagar NotFoundException desde el servicio', async () => {
      service.getById.mockRejectedValue(new NotFoundException());

      await expect(controller.getById(ORDER_ID, MOCK_USER)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
