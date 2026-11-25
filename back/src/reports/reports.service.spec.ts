import type { Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AppRoles } from '../auth/interfaces/app-roles';
import { Order } from '../orders/entities/order.entity';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let orderRepo: { query: Mock };

  beforeEach(async () => {
    orderRepo = { query: vi.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Order), useValue: orderRepo },
      ],
    }).compile();

    service = module.get(ReportsService);
  });

  it('el proveedor consulta solo sus propios datos', async () => {
    await service.getSummary({ id: 'provider-1', roles: [AppRoles.PROVIDER] });

    expect(orderRepo.query).toHaveBeenCalledTimes(3);
    for (const call of orderRepo.query.mock.calls) {
      expect(call[1]).toEqual(['provider-1']);
    }
  });

  it('el administrador consulta el total global (sin filtro de proveedor)', async () => {
    await service.getSummary({ id: 'admin-1', roles: [AppRoles.ADMIN] });

    for (const call of orderRepo.query.mock.calls) {
      expect(call[1]).toEqual([null]);
    }
  });

  it('devuelve los tres reportes', async () => {
    orderRepo.query
      .mockResolvedValueOnce([{ month: '2026-11', revenue: 100 }])
      .mockResolvedValueOnce([
        { id: 's1', title: 'Logo', sales: 2, revenue: 100 },
      ])
      .mockResolvedValueOnce([
        { month: '2026-11', status: 'COMPLETED', total: 2 },
      ]);

    const result = await service.getSummary({
      id: 'provider-1',
      roles: [AppRoles.PROVIDER],
    });

    expect(result.revenueByMonth).toHaveLength(1);
    expect(result.topServices[0].title).toBe('Logo');
    expect(result.ordersByMonthAndStatus[0].total).toBe(2);
  });
});
