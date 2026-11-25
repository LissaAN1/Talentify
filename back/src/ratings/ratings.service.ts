import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order, OrderStatus } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Rating } from './entities/rating.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(userId: string, dto: CreateRatingDto): Promise<Rating> {
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId },
      relations: { user: true, service: { provider: true } },
    });

    if (!order) {
      throw new NotFoundException(`Orden con id ${dto.orderId} no encontrada`);
    }

    if (order.user.id !== userId) {
      throw new ForbiddenException(
        'Solo el cliente de la orden puede calificar',
      );
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException(
        'Solo se pueden calificar órdenes COMPLETED',
      );
    }

    const existing = await this.ratingRepository.findOne({
      where: { order: { id: order.id } },
    });

    if (existing) {
      throw new ConflictException('Esta orden ya fue calificada');
    }

    const rating = this.ratingRepository.create({
      order,
      client: { id: userId } as User,
      provider: order.service.provider,
      score: dto.score,
      comment: dto.comment ?? null,
    });

    return this.ratingRepository.save(rating);
  }

  // Promedio y cantidad de calificaciones de un proveedor
  async getProviderSummary(providerId: string) {
    const raw = await this.ratingRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.score)', 'average')
      .addSelect('COUNT(rating.id)', 'count')
      .where('rating.provider_id = :providerId', { providerId })
      .getRawOne<{ average: string | null; count: string }>();

    return {
      providerId,
      average: raw?.average ? Number(Number(raw.average).toFixed(1)) : 0,
      count: Number(raw?.count ?? 0),
    };
  }
}
