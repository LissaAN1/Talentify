import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const { serviceId, ...orderData } = createOrderDto;

    const order: Order = this.orderRepository.create({
      ...orderData,
      user: { id: userId } as User,
      service: { id: serviceId } as Service,
      status: OrderStatus.PENDING,
    });
    return this.orderRepository.save(order);
  }

  getAll(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: { user: true, service: { provider: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async getById(orderId: string, userId: string): Promise<Order> {
    const order: Order | null = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { user: true, service: { provider: true } },
    });

    if (order == null)
      throw new NotFoundException(`Orden con id ${orderId} no encontrada`);

    if (order.user.id !== userId)
      throw new ForbiddenException(
        `No tienes permiso para acceder a esta orden`,
      );

    return order;
  }

  getByProvider(providerId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        service: {
          provider: {
            id: providerId,
          },
        },
      },
      relations: {
        user: true,
        service: {
          provider: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
