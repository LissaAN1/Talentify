import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Order } from '../orders/entities/order.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

describe('SeedModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [SeedModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue({})
      .overrideProvider(getRepositoryToken(Service))
      .useValue({})
      .overrideProvider(getRepositoryToken(Order))
      .useValue({})
      .compile();
  });

  it('debería compilar el módulo', () => {
    expect(module).toBeDefined();
  });

  it('debería proveer SeedService', () => {
    const seedService = module.get<SeedService>(SeedService);

    expect(seedService).toBeDefined();
    expect(seedService).toBeInstanceOf(SeedService);
  });
});