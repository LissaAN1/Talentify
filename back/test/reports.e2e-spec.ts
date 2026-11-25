import type { Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { ReportsModule } from '../src/reports/reports.module';
import { Order } from '../src/orders/entities/order.entity';
import { User } from '../src/users/entities/user.entity';
import { AppRoles } from '../src/auth/interfaces/app-roles';

const JWT_SECRET = 'S@p3rS3cr3t';
process.env.JWT_SECRET = JWT_SECRET;
const ADMIN_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01';
const PROVIDER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02';
const CLIENT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03';

const roles: Record<string, AppRoles> = {
  [ADMIN_ID]: AppRoles.ADMIN,
  [PROVIDER_ID]: AppRoles.PROVIDER,
  [CLIENT_ID]: AppRoles.CLIENT,
};

describe('Reports (integración)', () => {
  let app: INestApplication;
  let tokens: Record<string, string>;
  let orderRepo: { query: Mock };

  beforeAll(async () => {
    orderRepo = { query: vi.fn().mockResolvedValue([]) };
    const userRepo = {
      findOne: vi.fn(({ where }) =>
        Promise.resolve(
          roles[where.id] && where.isActive
            ? {
                id: where.id,
                email: `${where.id}@u.icesi.edu.co`,
                name: 'Usuario',
                roles: [roles[where.id]],
                isActive: true,
              }
            : null,
        ),
      ),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
        ReportsModule,
      ],
    })
      .overrideProvider(getRepositoryToken(Order))
      .useValue(orderRepo)
      .overrideProvider(getRepositoryToken(User))
      .useValue(userRepo)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const jwt = moduleFixture.get(JwtService);
    tokens = {
      admin: jwt.sign({ user_id: ADMIN_ID }),
      provider: jwt.sign({ user_id: PROVIDER_ID }),
      client: jwt.sign({ user_id: CLIENT_ID }),
    };
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    orderRepo.query.mockClear();
  });

  it('GET /reports/summary sin token responde 401', async () => {
    await request(app.getHttpServer()).get('/reports/summary').expect(401);
  });

  it('un cliente no puede ver reportes (403)', async () => {
    await request(app.getHttpServer())
      .get('/reports/summary')
      .set('Authorization', `Bearer ${tokens.client}`)
      .expect(403);
  });

  it('el administrador ve todo el marketplace (sin filtro de proveedor)', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports/summary')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    expect(res.body).toHaveProperty('revenueByMonth');
    expect(res.body).toHaveProperty('topServices');
    expect(res.body).toHaveProperty('ordersByMonthAndStatus');
    expect(orderRepo.query.mock.calls[0][1]).toEqual([null]);
  });

  it('el proveedor ve solo lo suyo (filtra por su id)', async () => {
    await request(app.getHttpServer())
      .get('/reports/summary')
      .set('Authorization', `Bearer ${tokens.provider}`)
      .expect(200);

    expect(orderRepo.query.mock.calls[0][1]).toEqual([PROVIDER_ID]);
  });
});
