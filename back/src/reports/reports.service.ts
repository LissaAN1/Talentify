import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppRoles } from '../auth/interfaces/app-roles';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  // El proveedor ve solo lo suyo; el administrador ve todo (providerId = null)
  async getSummary(user: Pick<User, 'id' | 'roles'>) {
    const providerId = user.roles.includes(AppRoles.ADMIN) ? null : user.id;

    const [revenueByMonth, topServices, ordersByMonthAndStatus] =
      await Promise.all([
        this.orderRepository.query(
          `SELECT TO_CHAR(DATE_TRUNC('month', o.created_at), 'YYYY-MM') AS month,
                  COALESCE(SUM(o."totalAmount"), 0)::float AS revenue
             FROM orders o
             JOIN services s ON s.id = o.service_id
            WHERE o.status = 'COMPLETED'
              AND ($1::uuid IS NULL OR s.provider_id = $1::uuid)
            GROUP BY 1
            ORDER BY 1`,
          [providerId],
        ),
        this.orderRepository.query(
          `SELECT s.id, s.title,
                  COUNT(o.id)::int AS sales,
                  COALESCE(SUM(o."totalAmount"), 0)::float AS revenue
             FROM orders o
             JOIN services s ON s.id = o.service_id
            WHERE o.status = 'COMPLETED'
              AND ($1::uuid IS NULL OR s.provider_id = $1::uuid)
            GROUP BY s.id, s.title
            ORDER BY sales DESC, revenue DESC
            LIMIT 5`,
          [providerId],
        ),
        this.orderRepository.query(
          `SELECT TO_CHAR(DATE_TRUNC('month', o.created_at), 'YYYY-MM') AS month,
                  o.status AS status,
                  COUNT(*)::int AS total
             FROM orders o
             JOIN services s ON s.id = o.service_id
            WHERE ($1::uuid IS NULL OR s.provider_id = $1::uuid)
            GROUP BY 1, 2
            ORDER BY 1, 2`,
          [providerId],
        ),
      ]);

    return { revenueByMonth, topServices, ordersByMonthAndStatus };
  }
}
