import type { Mock } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Rating } from './entities/rating.entity';
import { RatingsService } from './ratings.service';

describe('RatingsService', () => {
  let service: RatingsService;
  let ratingRepo: { findOne: Mock; create: Mock; save: Mock };
  let orderRepo: { findOne: Mock };

  const buildOrder = (status: OrderStatus, clientId = 'client-1') =>
    ({
      id: 'order-1',
      status,
      user: { id: clientId },
      service: { provider: { id: 'provider-1' } },
    }) as unknown as Order;

  beforeEach(async () => {
    ratingRepo = {
      findOne: vi.fn(),
      create: vi.fn((r) => r),
      save: vi.fn((r) => Promise.resolve(r)),
    };
    orderRepo = { findOne: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        { provide: getRepositoryToken(Rating), useValue: ratingRepo },
        { provide: getRepositoryToken(Order), useValue: orderRepo },
      ],
    }).compile();

    service = module.get(RatingsService);
  });

  it('guarda la calificación de una orden COMPLETED del propio cliente', async () => {
    orderRepo.findOne.mockResolvedValue(buildOrder(OrderStatus.COMPLETED));
    ratingRepo.findOne.mockResolvedValue(null);

    const result = await service.create('client-1', {
      orderId: 'order-1',
      score: 5,
      comment: 'Excelente',
    });

    expect(result.score).toBe(5);
    expect(result.provider).toEqual({ id: 'provider-1' });
  });

  it('lanza NotFoundException si la orden no existe', async () => {
    orderRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create('client-1', { orderId: 'x', score: 5 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('lanza ForbiddenException si quien califica no es el cliente de la orden', async () => {
    orderRepo.findOne.mockResolvedValue(buildOrder(OrderStatus.COMPLETED));

    await expect(
      service.create('otro', { orderId: 'order-1', score: 5 }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lanza BadRequestException si la orden no está COMPLETED', async () => {
    orderRepo.findOne.mockResolvedValue(buildOrder(OrderStatus.PAID));

    await expect(
      service.create('client-1', { orderId: 'order-1', score: 5 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lanza ConflictException si la orden ya fue calificada', async () => {
    orderRepo.findOne.mockResolvedValue(buildOrder(OrderStatus.COMPLETED));
    ratingRepo.findOne.mockResolvedValue({ id: 'r-1' });

    await expect(
      service.create('client-1', { orderId: 'order-1', score: 4 }),
    ).rejects.toThrow(ConflictException);
  });

  it('calcula el promedio con un decimal y la cantidad', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getRawOne: vi.fn().mockResolvedValue({ average: '4.6666', count: '3' }),
    };
    (ratingRepo as any).createQueryBuilder = vi.fn(() => qb);

    await expect(service.getProviderSummary('provider-1')).resolves.toEqual({
      providerId: 'provider-1',
      average: 4.7,
      count: 3,
    });
  });
});
