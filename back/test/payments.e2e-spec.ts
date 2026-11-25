import type { Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { PaymentsModule } from '../src/payments/payments.module';
import { Order, OrderStatus } from '../src/orders/entities/order.entity';
import { User } from '../src/users/entities/user.entity';
import { AppRoles } from '../src/auth/interfaces/app-roles';

const { mockCreate, mockConstructEvent } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockConstructEvent: vi.fn(),
}));

vi.mock('stripe', () => ({
  default: class {
    checkout = { sessions: { create: mockCreate } };
    webhooks = { constructEvent: mockConstructEvent };
  },
}));

const JWT_SECRET = 'S@p3rS3cr3t';
process.env.JWT_SECRET = JWT_SECRET;
const USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const OTHER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const ORDER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

const clientFromDb = (id: string): Partial<User> => ({
  id,
  email: `${id}@u.icesi.edu.co`,
  name: 'Cliente',
  roles: [AppRoles.CLIENT],
  isActive: true,
});

describe('Payments (integración)', () => {
  let app: INestApplication;
  let token: string;
  let otherToken: string;
  let orderRepo: { findOne: Mock; update: Mock };

  const order = (status: OrderStatus) =>
    ({
      id: ORDER_ID,
      status,
      totalAmount: 250000,
      user: { id: USER_ID },
      service: { title: 'Logo' },
    }) as unknown as Order;

  beforeAll(async () => {
    orderRepo = { findOne: vi.fn(), update: vi.fn() };
    const userRepo = {
      findOne: vi.fn(({ where }) =>
        Promise.resolve(
          [USER_ID, OTHER_ID].includes(where.id) && where.isActive
            ? clientFromDb(where.id)
            : null,
        ),
      ),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              STRIPE_SECRET_KEY: 'sk_test_falsa',
              STRIPE_WEBHOOK_SECRET: 'whsec_falsa',
              FRONTEND_URL: 'http://localhost:3001',
            }),
          ],
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
        PaymentsModule,
      ],
    })
      .overrideProvider(getRepositoryToken(Order))
      .useValue(orderRepo)
      .overrideProvider(getRepositoryToken(User))
      .useValue(userRepo)
      .compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    const jwt = moduleFixture.get(JwtService);
    token = jwt.sign({ user_id: USER_ID });
    otherToken = jwt.sign({ user_id: OTHER_ID });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /payments/checkout/:id sin token responde 401', async () => {
    await request(app.getHttpServer())
      .post(`/payments/checkout/${ORDER_ID}`)
      .expect(401);
  });

  it('crea la sesión de Stripe Checkout para una orden PENDING del cliente', async () => {
    orderRepo.findOne.mockResolvedValue(order(OrderStatus.PENDING));
    mockCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/c/pay/cs_test_1',
    });

    const res = await request(app.getHttpServer())
      .post(`/payments/checkout/${ORDER_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.url).toContain('checkout.stripe.com');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('responde 403 si la orden es de otro cliente', async () => {
    orderRepo.findOne.mockResolvedValue(order(OrderStatus.PENDING));
    await request(app.getHttpServer())
      .post(`/payments/checkout/${ORDER_ID}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
  });

  it('responde 400 si la orden no está PENDING', async () => {
    orderRepo.findOne.mockResolvedValue(order(OrderStatus.PAID));
    await request(app.getHttpServer())
      .post(`/payments/checkout/${ORDER_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('responde 404 si la orden no existe', async () => {
    orderRepo.findOne.mockResolvedValue(null);
    await request(app.getHttpServer())
      .post(`/payments/checkout/${ORDER_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('el webhook con firma inválida responde 400', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('firma');
    });
    await request(app.getHttpServer())
      .post('/payments/webhook')
      .set('stripe-signature', 'mala')
      .send({ a: 1 })
      .expect(400);
  });

  it('el webhook checkout.session.completed marca la orden como PAID', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { metadata: { orderId: ORDER_ID } } },
    });
    const res = await request(app.getHttpServer())
      .post('/payments/webhook')
      .set('stripe-signature', 'firma-valida')
      .send({ a: 1 })
      .expect(200);

    expect(res.body).toEqual({ received: true });
    expect(orderRepo.update).toHaveBeenCalledWith(
      { id: ORDER_ID, status: OrderStatus.PENDING },
      { status: OrderStatus.PAID },
    );
  });
});
