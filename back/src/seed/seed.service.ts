import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { Order } from '../orders/entities/order.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { seedOrders, seedServices, seedUsers } from './data/seed-data';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async onApplicationBootstrap() {
    await this.runSeed();
  }

  async runSeed() {
    for (const userData of seedUsers) {
      const exists = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (exists) continue;

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(userData.password, 10),
        refreshToken: null,
      });

      await this.userRepository.save(user);
    }

    for (const serviceData of seedServices) {
      const exists = await this.serviceRepository.findOne({
        where: { title: serviceData.title },
      });

      if (exists) continue;

      const provider = await this.userRepository.findOne({
        where: { email: serviceData.providerEmail },
      });

      if (!provider) continue;

      const { providerEmail, ...serviceInfo } = serviceData;

      const service = this.serviceRepository.create({
        ...serviceInfo,
        provider,
      });

      await this.serviceRepository.save(service);
    }

    for (const orderData of seedOrders) {
      const user = await this.userRepository.findOne({
        where: { email: orderData.userEmail },
      });

      const service = await this.serviceRepository.findOne({
        where: { title: orderData.serviceTitle },
      });

      if (!user || !service) continue;

      const exists = await this.orderRepository.findOne({
        where: {
          user: { id: user.id },
          service: { id: service.id },
        },
      });

      if (exists) continue;

      const { userEmail, serviceTitle, ...orderInfo } = orderData;

      const order = this.orderRepository.create({
        ...orderInfo,
        user,
        service,
      });

      await this.orderRepository.save(order);
    }
  }
}
