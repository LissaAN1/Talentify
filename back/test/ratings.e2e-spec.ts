import type { Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { RatingsModule } from '../src/ratings/ratings.module';
import { Rating } from '../src/ratings/entities/rating.entity';
import { Order, OrderStatus } from '../src/orders/entities/order.entity';
import { User } from '../src/users/entities/user.entity';
import { AppRoles } from '../src/auth/interfaces/app-roles';

const JWT_SECRET = 'S@p3rS3cr3t';
process.env.JWT_SECRET = JWT_SECRET;
const CLIENT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const OTHER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const PROVIDER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
const ORDER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

const dbUser = (id: string, role: AppRoles): Partial<User> => ({
  id,
  email: `${id}@u.icesi.edu.co`,
  name: 'Usuario',
  roles: [role],
  isActive: true,
});

describe('Ratings (integración)', () => {
  let app: INestApplication;
  let clientToken: string;
  let otherToken: string;
  let providerToken: string;
  let orderRepo: { findOne: Mock };
  let ratingRepo: Record<string, Mock>;

  const order = (status: OrderStatus) =>
    ({
      id: ORDER_ID,
      status,
      user: { id: CLIENT_ID },
      service: { provider: { id: PROVIDER_ID } },
    }) as unknown as Order;

  beforeAll(async () => {
    orderRepo = { findOne: vi.fn() };
    ratingRepo = {
      findOne: vi.fn(),
      create: vi.fn((x) => x),
      save: vi.fn((x) => Promise.resolve({ id: 'rating-1', ...x })),
      createQueryBuilder: vi.fn(),
    };
    const userRepo = {
      findOne: vi.fn(({ where }) => {
        if (!where.isActive) return Promise.resolve(null);
        if (where.id === CLIENT_ID || where.id === OTHER_ID)
          return Promise.resolve(dbUser(where.id, AppRoles.CLIENT));
        if (where.id === PROVIDER_ID)
          return Promise.resolve(dbUser(where.id, AppRoles.PROVIDER));
        return Promise.resolve(null);
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
        RatingsModule,
      ],
    })
      .overrideProvider(getRepositoryToken(Order))
      .useValue(orderRepo)
      .overrideProvider(getRepositoryToken(Rating))
      .useValue(ratingRepo)
      .overrideProvider(getRepositoryToken(User))
      .useValue(userRepo)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    const jwt = moduleFixture.get(JwtService);
    clientToken = jwt.sign({ user_id: CLIENT_ID });
    otherToken = jwt.sign({ user_id: OTHER_ID });
    providerToken = jwt.sign({ user_id: PROVIDER_ID });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    orderRepo.findOne.mockReset();
    ratingRepo.findOne.mockReset();
    ratingRepo.save.mockClear();
  });

  const post = (token: string | null, body: object) => {
    const r = request(app.getHttpServer()).post('/ratings');
    return (token ? r.set('Authorization', `Bearer ${token}`) : r).send(body);
  };

  it('POST /ratings sin token responde 401', async () => {
    await post(null, { orderId: ORDER_ID, score: 5 }).expect(401);
  });

  it('un proveedor no puede calificar (403)', async () => {
    await post(providerToken, { orderId: ORDER_ID, score: 5 }).expect(403);
  });

  it('el cliente califica una orden COMPLETED', async () => {
    orderRepo.findOne.mockResolvedValue(order(OrderStatus.COMPLETED));
    ratingRepo.findOne.mockResolvedValue(null);

    const res = await post(clientToken, {
      orderId: ORDER_ID,
      score: 5,
      comment: 'Excelente',
    }).expect(201);

    expect(res.body.score).toBe(5);
    expect(ratingRepo.save).toHaveBeenCalledTimes(1);
  });

  it('rechaza puntajes fuera de 1 a 5 (400)', async () => {
    await post(clientToken, { orderId: ORDER_ID, score: 9 }).expect(400);
    await post(clientToken, { orderId: ORDER_ID, score: 0 }).expect(400);
  });

  it('rechaza órdenes que no están COMPLETED (400)', async () => {
    orderRepo.findOne.mockResolvedValue(order(OrderStatus.IN_PROGRESS));
    await post(clientToken, { orderId: ORDER_ID, score: 4 }).expect(400);
  });

  it('otro cliente no puede calificar la orden (403)', async () => {
    orderRepo.findOne.mockResolvedValue(order(OrderStatus.COMPLETED));
    await post(otherToken, { orderId: ORDER_ID, score: 4 }).expect(403);
  });

  it('no permite calificar dos veces la misma orden (409)', async () => {
    orderRepo.findOne.mockResolvedValue(order(OrderStatus.COMPLETED));
    ratingRepo.findOne.mockResolvedValue({ id: 'existente' });
    await post(clientToken, { orderId: ORDER_ID, score: 4 }).expect(409);
  });

  it('responde 404 si la orden no existe', async () => {
    orderRepo.findOne.mockResolvedValue(null);
    await post(clientToken, { orderId: ORDER_ID, score: 4 }).expect(404);
  });

  it('GET /ratings/provider/:id devuelve promedio y cantidad', async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getRawOne: vi.fn().mockResolvedValue({ average: '4.50', count: '2' }),
    };
    ratingRepo.createQueryBuilder.mockReturnValue(qb);

    const res = await request(app.getHttpServer())
      .get(`/ratings/provider/${PROVIDER_ID}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);

    expect(res.body).toEqual({
      providerId: PROVIDER_ID,
      average: 4.5,
      count: 2,
    });
  });
});
