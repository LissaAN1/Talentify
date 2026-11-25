import type { Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { OrdersModule } from '../src/orders/orders.module';
import { Order, OrderStatus } from '../src/orders/entities/order.entity';
import { User } from '../src/users/entities/user.entity';
import { Service } from '../src/services/entities/service.entity';
import { AppRoles } from '../src/auth/interfaces/app-roles';

const JWT_SECRET = 'S@p3rS3cr3t';
const USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const OTHER_UID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const ORDER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const SERVICE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
process.env.JWT_SECRET = JWT_SECRET;

const mockUserFromDb: Partial<User> = {
  id: USER_ID,
  email: 'user@u.icesi.edu.co',
  name: 'Usuario Test',
  roles: [AppRoles.CLIENT],
  isActive: true,
};
const mockOtherUserFromDb: Partial<User> = {
  id: OTHER_UID,
  email: 'other@u.icesi.edu.co',
  name: 'Otro Usuario',
  roles: [AppRoles.CLIENT],
  isActive: true,
};

function makeUser(id: string = USER_ID): User {
  const user = new User();
  user.id = id;
  return user;
}

function makeService(id: string = SERVICE_ID): Service {
  const service = new Service();
  service.id = id;
  return service;
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  const order = new Order();
  order.id = ORDER_ID;
  order.user = makeUser();
  order.service = makeService();
  order.status = OrderStatus.PENDING;
  order.totalAmount = 100;
  order.notes = null;
  order.createdAt = new Date('2024-01-01T00:00:00.000Z');
  order.updatedAt = new Date('2024-01-01T00:00:00.000Z');
  return Object.assign(order, overrides);
}

describe('Orders (integración)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let mockOrderRepo: Record<string, Mock>;
  let mockUserRepo: { findOne: Mock };

  // Tokens para USER_ID y OTHER_UID
  let token: string;
  let otherToken: string;

  beforeAll(async () => {
    mockOrderRepo = {
      create: vi.fn(),
      save: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
    };

    mockUserRepo = {
      findOne: vi.fn().mockImplementation(({ where }) => {
        if (where.id === USER_ID && where.isActive)
          return Promise.resolve(mockUserFromDb);
        if (where.id === OTHER_UID && where.isActive)
          return Promise.resolve(mockOtherUserFromDb);
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
        OrdersModule,
      ],
    })
      .overrideProvider(getRepositoryToken(Order))
      .useValue(mockOrderRepo)
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepo)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);

    token = jwtService.sign({ user_id: USER_ID });
    otherToken = jwtService.sign({ user_id: OTHER_UID });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRepo.findOne.mockImplementation(({ where }) => {
      if (where.id === USER_ID && where.isActive)
        return Promise.resolve(mockUserFromDb);
      if (where.id === OTHER_UID && where.isActive)
        return Promise.resolve(mockOtherUserFromDb);
      return Promise.resolve(null);
    });
  });

  describe('POST /orders', () => {
    const validBody = { serviceId: SERVICE_ID, totalAmount: 150 };

    it('201 — crea una orden y retorna el objeto con status PENDING', async () => {
      const built = makeOrder({ totalAmount: 150 });
      mockOrderRepo.create.mockReturnValue(built);
      mockOrderRepo.save.mockResolvedValue({ ...built, id: ORDER_ID });

      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(validBody)
        .expect(201);

      expect(res.body.status).toBe(OrderStatus.PENDING);
      expect(res.body.user.id).toBe(USER_ID);
      expect(mockOrderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { id: USER_ID },
          service: { id: SERVICE_ID },
          status: OrderStatus.PENDING,
        }),
      );
    });

    it('201 — acepta notas opcionales', async () => {
      const built = makeOrder({ totalAmount: 200, notes: 'Urgente' });
      mockOrderRepo.create.mockReturnValue(built);
      mockOrderRepo.save.mockResolvedValue(built);

      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validBody, totalAmount: 200, notes: 'Urgente' })
        .expect(201);

      expect(res.body.notes).toBe('Urgente');
    });

    it('400 — rechaza body sin serviceId', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ totalAmount: 100 })
        .expect(400);
    });

    it('400 — rechaza serviceId que no es UUID', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ serviceId: 'no-es-uuid', totalAmount: 100 })
        .expect(400);
    });

    it('400 — rechaza totalAmount negativo', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ serviceId: SERVICE_ID, totalAmount: -50 })
        .expect(400);
    });

    it('400 — rechaza campos extra (forbidNonWhitelisted)', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validBody, campoExtra: 'valor' })
        .expect(400);
    });

    it('401 — rechaza petición sin token', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send(validBody)
        .expect(401);
    });
  });

  describe('GET /orders', () => {
    it('200 — retorna todas las órdenes del usuario autenticado', async () => {
      const orders = [
        makeOrder(),
        makeOrder({ id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55' }),
      ];
      mockOrderRepo.find.mockResolvedValue(orders);

      const res = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(mockOrderRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user: { id: USER_ID } },
          relations: { user: true, service: { provider: true } },
        }),
      );
    });

    it('200 — retorna arreglo vacío si el usuario no tiene órdenes', async () => {
      mockOrderRepo.find.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('401 — rechaza petición sin token', async () => {
      await request(app.getHttpServer()).get('/orders').expect(401);
    });
  });

  describe('GET /orders/provider', () => {
    it('200 — retorna órdenes asociadas a servicios del proveedor autenticado', async () => {
      const orders = [
        makeOrder(),
        makeOrder({ id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55' }),
      ];

      mockOrderRepo.find.mockResolvedValue(orders);

      const res = await request(app.getHttpServer())
        .get('/orders/provider')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);

      expect(mockOrderRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            service: {
              provider: {
                id: USER_ID,
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
        }),
      );
    });

    it('200 — retorna arreglo vacío si el proveedor no tiene trabajos recibidos', async () => {
      mockOrderRepo.find.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/orders/provider')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('401 — rechaza petición sin token', async () => {
      await request(app.getHttpServer()).get('/orders/provider').expect(401);
    });
  });

  describe('GET /orders/:orderId', () => {
    it('200 — retorna la orden cuando existe y pertenece al usuario', async () => {
      mockOrderRepo.findOne.mockResolvedValue(makeOrder());

      const res = await request(app.getHttpServer())
        .get(`/orders/${ORDER_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(ORDER_ID);
      expect(res.body.user.id).toBe(USER_ID);
    });

    it('404 — orden no encontrada', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`/orders/${ORDER_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('403 — orden pertenece a otro usuario', async () => {
      mockOrderRepo.findOne.mockResolvedValue(
        makeOrder({ user: makeUser(OTHER_UID) }),
      );

      await request(app.getHttpServer())
        .get(`/orders/${ORDER_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('400 — orderId no es UUID válido', async () => {
      await request(app.getHttpServer())
        .get('/orders/no-es-uuid')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('401 — rechaza petición sin token', async () => {
      await request(app.getHttpServer()).get(`/orders/${ORDER_ID}`).expect(401);
    });
  });
});
