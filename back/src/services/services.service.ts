import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { Service, ServiceStatus } from './entities/service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async getOneById(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({ where: { id } });

    if (!service) {
      throw new NotFoundException(
        `No se encontró un servicio con el id: ${id}`,
      );
    }

    return service;
  }

  async create(
    provider: User,
    createServiceDto: CreateServiceDto,
  ): Promise<Service> {
    const newService = this.serviceRepository.create({
      ...createServiceDto,
      provider,
      status: ServiceStatus.ACTIVE,
    });

    return this.serviceRepository.save(newService);
  }
}
