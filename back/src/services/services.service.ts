import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppRoles } from '../auth/interfaces/app-roles';
import { User } from '../users/entities/user.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service, ServiceStatus } from './entities/service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  getByProvider(providerId: string): Promise<Service[]> {
    return this.serviceRepository.find({
      where: { provider: { id: providerId } },
      order: { createdAt: 'DESC' },
    });
  }

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

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
    requestingUser: User,
  ): Promise<Service> {
    const service = await this.getOneById(id);

    const isAdmin = requestingUser.roles.includes(AppRoles.ADMIN);
    const isOwner = service.provider.id === requestingUser.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'No tienes permisos para modificar este servicio',
      );
    }

    if (!isAdmin && updateServiceDto.status) {
      throw new ForbiddenException(
        'Solo un administrador puede cambiar el estado del servicio',
      );
    }

    Object.assign(service, updateServiceDto);

    return this.serviceRepository.save(service);
  }

  async delete(id: string, requestingUser: User): Promise<Service> {
    const service = await this.getOneById(id);

    const isAdmin = requestingUser.roles.includes(AppRoles.ADMIN);
    const isOwner = service.provider.id === requestingUser.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar este servicio',
      );
    }

    service.status = ServiceStatus.INACTIVE;

    return this.serviceRepository.save(service);
  }
}
