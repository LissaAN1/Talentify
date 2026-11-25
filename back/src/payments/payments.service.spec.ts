import type { Mock } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Order, OrderStatus } from '../orders/entities/order.entity';
import { PaymentsService } from './payments.service';

const { mockCreate, mockConstructEvent } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockConstructEvent: vi.fn(),
}));

vi.mock('stripe', () => ({
  default: class {
    checkout = { sessions: { create: mockCreate } };
    webhooks = { constructEvent: mockConstructEvent };
  },
}));

describe('PaymentsService', () => {
  let service: PaymentsService;
  let orderRepo: { findOne: Mock; update: Mock };

  const buildOrder = (status: OrderStatus) =>
    ({
      id: 'order-1',
      status,
      totalAmount: 250000,
      user: { id: 'client-1' },
      service: { title: 'Logo' },
    }) as unknown as Order;

  beforeEach(async () => {
    vi.clearAllMocks();
    orderRepo = { findOne: vi.fn(), update: vi.fn() };

    const config = {
      getOrThrow: vi.fn((key: string) => `valor-${key}`),
      get: vi.fn(() => 'http://localhost:3001'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: ConfigService, useValue: config },
        { provide: getRepositoryToken(Order), useValue: orderRepo },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  it('crea la sesión de Checkout en COP con el id de la orden en metadata', async () => {
    orderRepo.findOne.mockResolvedValue(buildOrder(OrderStatus.PENDING));
    mockCreate.mockResolvedValue({ url: 'https://checkout.stripe.test/s1' });

    const result = await service.createCheckoutSession('order-1', 'client-1');

    expect(result).toEqual({ url: 'https://checkout.stripe.test/s1' });
    const args = mockCreate.mock.calls[0][0];
    expect(args.line_items[0].price_data.currency).toBe('cop');
    expect(args.line_items[0].price_data.unit_amount).toBe(25000000);
    expect(args.metadata).toEqual({ orderId: 'order-1' });
  });

  it('rechaza pagar una orden de otro cliente', async () => {
    orderRepo.findOne.mockResolvedValue(buildOrder(OrderStatus.PENDING));

    await expect(
      service.createCheckoutSession('order-1', 'otro'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rechaza pagar una orden que no está PENDING', async () => {
    orderRepo.findOne.mockResolvedValue(buildOrder(OrderStatus.PAID));

    await expect(
      service.createCheckoutSession('order-1', 'client-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('el webhook pasa la orden de PENDING a PAID', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { metadata: { orderId: 'order-1' } } },
    });

    await expect(
      service.handleWebhook(Buffer.from('{}'), 'firma'),
    ).resolves.toEqual({ received: true });

    expect(orderRepo.update).toHaveBeenCalledWith(
      { id: 'order-1', status: OrderStatus.PENDING },
      { status: OrderStatus.PAID },
    );
  });

  it('el webhook rechaza una firma inválida', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('firma');
    });

    await expect(
      service.handleWebhook(Buffer.from('{}'), 'mala'),
    ).rejects.toThrow(BadRequestException);
  });
});
