import type { Mock } from 'vitest';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AppRoles } from '../auth/interfaces/app-roles';
import { Order, OrderStatus } from './entities/order.entity';
import { OrdersService } from './orders.service';

describe('OrdersService · acceso por participante y cambio de estado', () => {
  let service: OrdersService;
  let mockOrderRepository: { findOne: Mock; save: Mock };

  const client = { id: 'client-1', roles: [AppRoles.CLIENT] };
  const provider = { id: 'provider-1', roles: [AppRoles.PROVIDER] };
  const admin = { id: 'admin-1', roles: [AppRoles.ADMIN] };
  const stranger = { id: 'other-1', roles: [AppRoles.CLIENT] };

  const buildOrder = (status: OrderStatus) =>
    ({
      id: 'order-1',
      status,
      user: { id: client.id },
      service: { provider: { id: provider.id } },
    }) as unknown as Order;

  beforeEach(async () => {
    mockOrderRepository = { findOne: vi.fn(), save: vi.fn((o) => o) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  describe('getById()', () => {
    it('permite ver la orden al cliente, al proveedor y al administrador', async () => {
      mockOrderRepository.findOne.mockResolvedValue(
        buildOrder(OrderStatus.PAID),
      );

      await expect(service.getById('order-1', client)).resolves.toBeDefined();
      await expect(service.getById('order-1', provider)).resolves.toBeDefined();
      await expect(service.getById('order-1', admin)).resolves.toBeDefined();
    });

    it('lanza ForbiddenException si el usuario no participa en la orden', async () => {
      mockOrderRepository.findOne.mockResolvedValue(
        buildOrder(OrderStatus.PAID),
      );

      await expect(service.getById('order-1', stranger)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('lanza NotFoundException si la orden no existe', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.getById('x', client)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus()', () => {
    it('el proveedor pasa la orden PAID → IN_PROGRESS', async () => {
      mockOrderRepository.findOne.mockResolvedValue(
        buildOrder(OrderStatus.PAID),
      );

      const result = await service.updateStatus('order-1', provider, {
        status: OrderStatus.IN_PROGRESS,
      });

      expect(result.status).toBe(OrderStatus.IN_PROGRESS);
    });

    it('rechaza la transición PENDING → COMPLETED con un mensaje claro', async () => {
      mockOrderRepository.findOne.mockResolvedValue(
        buildOrder(OrderStatus.PENDING),
      );

      await expect(
        service.updateStatus('order-1', provider, {
          status: OrderStatus.COMPLETED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('el cliente puede cancelar una orden PENDING', async () => {
      mockOrderRepository.findOne.mockResolvedValue(
        buildOrder(OrderStatus.PENDING),
      );

      const result = await service.updateStatus('order-1', client, {
        status: OrderStatus.CANCELLED,
      });

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('el cliente no puede avanzar el trabajo (PAID → IN_PROGRESS)', async () => {
      mockOrderRepository.findOne.mockResolvedValue(
        buildOrder(OrderStatus.PAID),
      );

      await expect(
        service.updateStatus('order-1', client, {
          status: OrderStatus.IN_PROGRESS,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('no permite mover una orden COMPLETED', async () => {
      mockOrderRepository.findOne.mockResolvedValue(
        buildOrder(OrderStatus.COMPLETED),
      );

      await expect(
        service.updateStatus('order-1', admin, {
          status: OrderStatus.CANCELLED,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
