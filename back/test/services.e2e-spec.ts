import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest'; // FIX: default import, no "* as"

import { AppRoles } from '../src/auth/interfaces/app-roles';
import {
  Service,
  ServiceCategory,
  ServiceStatus,
} from '../src/services/entities/service.entity';
import { ServicesService } from '../src/services/services.service';
import { ServicesController } from '../src/services/services.controller';

import { AuthGuard } from '@nestjs/passport';
import { UserRoleGuard } from '../src/auth/guards/user-role.guard';
import { ExecutionContext } from '@nestjs/common';

const PROVIDER_UUID = 'c0e2a4c6-d8f0-4ef8-bb6d-6bb9bd380b11';
const ADMIN_UUID = 'c0e2a4c6-d8f0-4ef8-bb6d-6bb9bd380b22';
const SERVICE_UUID = 'b0e2a4c6-d8f0-4ef8-bb6d-6bb9bd380a11';
const SERVICE_UUID2 = 'b0e2a4c6-d8f0-4ef8-bb6d-6bb9bd380a22';

// ─── Usuarios simulados ───────────────────────────────────────────────────────
const PROVIDER_USER = {
  id: PROVIDER_UUID,
  name: 'Provider Demo',
  email: 'provider@u.icesi.edu.co',
  roles: [AppRoles.PROVIDER],
  isActive: true,
};

const ADMIN_USER = {
  id: ADMIN_UUID,
  name: 'Admin Demo',
  email: 'admin@u.icesi.edu.co',
  roles: [AppRoles.ADMIN],
  isActive: true,
};

// ─── Helper: construye un Service ficticio ────────────────────────────────────
const makeService = (overrides: Partial<Service> = {}): Service =>
  ({
    id: SERVICE_UUID,
    title: 'Logo Design',
    description: 'Professional logo design for your brand.',
    price: 50,
    category: ServiceCategory.DESIGN,
    status: ServiceStatus.ACTIVE,
    provider: PROVIDER_USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as unknown as Service;

// ─── Mock ServicesService ─────────────────────────────────────────────────────
const mockServicesService = {
  getAll: vi.fn(),
  getOneById: vi.fn(),
  getByProvider: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

// ─── Setup ────────────────────────────────────────────────────────────────────
// Se crea UNA SOLA app con un usuario mutable en lugar de recrearla por cada
// test (evita fugas de recursos y es más rápido).
let app: INestApplication;
let simulatedUser: object = PROVIDER_USER;

beforeAll(async () => {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [ServicesController],
    providers: [{ provide: ServicesService, useValue: mockServicesService }],
  })
    // Mock JWT guard: inyecta el usuario simulado en req.user
    .overrideGuard(AuthGuard('jwt'))
    .useValue({
      canActivate: (ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        req.user = simulatedUser; // lee del closure, cambiable por test
        return true;
      },
    })
    // Mock role guard: siempre permite (roles validados en unit tests)
    .overrideGuard(UserRoleGuard)
    .useValue({ canActivate: () => true })
    .compile();

  app = module.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.init();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
  simulatedUser = PROVIDER_USER; // usuario por defecto
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Services (Integration)', () => {
  // ── GET /services ───────────────────────────────────────────────────────────
  describe('GET /services', () => {
    it('should return 200 with an array of active services', async () => {
      const services = [makeService(), makeService({ id: SERVICE_UUID2 })];
      mockServicesService.getAll.mockResolvedValue(services);

      const { status, body } = await request(app.getHttpServer()).get(
        '/services',
      );

      expect(status).toBe(200);
      expect(body).toHaveLength(2);
    });

    it('should return 200 with an empty array when no services exist', async () => {
      mockServicesService.getAll.mockResolvedValue([]);

      const { status, body } = await request(app.getHttpServer()).get(
        '/services',
      );

      expect(status).toBe(200);
      expect(body).toEqual([]);
    });
  });

  // ── GET /services/my ────────────────────────────────────────────────────────
  describe('GET /services/my', () => {
    it('should return 200 with all services of the authenticated provider', async () => {
      const services = [
        makeService(),
        makeService({ id: SERVICE_UUID2, status: ServiceStatus.INACTIVE }),
      ];
      mockServicesService.getByProvider.mockResolvedValue(services);

      const { status, body } = await request(app.getHttpServer()).get(
        '/services/my',
      );

      expect(status).toBe(200);
      expect(body).toHaveLength(2);
      expect(mockServicesService.getByProvider).toHaveBeenCalledWith(
        PROVIDER_UUID,
      );
    });
  });

  // ── GET /services/:id ───────────────────────────────────────────────────────
  describe('GET /services/:id', () => {
    it('should return 200 with the service when found', async () => {
      const mockService = makeService();
      mockServicesService.getOneById.mockResolvedValue(mockService);

      // FIX: UUID válido en la URL para que ParseUUIDPipe no lo rechace
      const { status, body } = await request(app.getHttpServer()).get(
        `/services/${SERVICE_UUID}`,
      );

      expect(status).toBe(200);
      expect(body.id).toBe(SERVICE_UUID);
    });

    it('should return 400 when id is not a valid UUID', async () => {
      const { status } = await request(app.getHttpServer()).get(
        '/services/not-a-uuid',
      );

      expect(status).toBe(400);
    });
  });

  // ── POST /services ──────────────────────────────────────────────────────────
  describe('POST /services', () => {
    const validDto = {
      title: 'Logo Design Service',
      description: 'Professional logo design for your brand.',
      price: 50,
      category: ServiceCategory.DESIGN,
    };

    it('should return 201 and the created service with valid data', async () => {
      const createdService = makeService();
      mockServicesService.create.mockResolvedValue(createdService);

      const { status, body } = await request(app.getHttpServer())
        .post('/services')
        .send(validDto);

      expect(status).toBe(201);
      expect(body.id).toBeDefined();
      expect(mockServicesService.create).toHaveBeenCalledWith(
        PROVIDER_USER,
        validDto,
      );
    });

    it('should return 400 when title is missing', async () => {
      // FIX: omitir el campo directamente en lugar de poner undefined
      // (JSON.stringify omite undefined, así que hay que construir el objeto sin la key)
      const { description, price, category } = validDto;

      const { status } = await request(app.getHttpServer())
        .post('/services')
        .send({ description, price, category });

      expect(status).toBe(400);
    });

    it('should return 400 when price is negative', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/services')
        .send({ ...validDto, price: -10 });

      expect(status).toBe(400);
    });

    it('should return 400 when category is invalid', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/services')
        .send({ ...validDto, category: 'INVALID_CATEGORY' });

      expect(status).toBe(400);
    });

    it('should return 400 when description is too short', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/services')
        .send({ ...validDto, description: 'Short' });

      expect(status).toBe(400);
    });
  });

  // ── PUT /services/:id ───────────────────────────────────────────────────────
  describe('PUT /services/:id', () => {
    it('should return 200 with the updated service', async () => {
      const updated = makeService({ title: 'Updated Title' });
      mockServicesService.update.mockResolvedValue(updated);

      // FIX: UUID válido en la URL
      const { status, body } = await request(app.getHttpServer())
        .put(`/services/${SERVICE_UUID}`)
        .send({ title: 'Updated Title' });

      expect(status).toBe(200);
      expect(body.title).toBe('Updated Title');
    });

    it('should return 400 with extra fields not in DTO (forbidNonWhitelisted)', async () => {
      // FIX: UUID válido para que el 400 provenga del ValidationPipe
      // y no del ParseUUIDPipe (que daría 400 por diferente razón)
      const { status } = await request(app.getHttpServer())
        .put(`/services/${SERVICE_UUID}`)
        .send({ title: 'Valid Title', unknownField: 'value' });

      expect(status).toBe(400);
    });

    it('should return 400 when id is not a valid UUID', async () => {
      const { status } = await request(app.getHttpServer())
        .put('/services/not-a-uuid')
        .send({ title: 'Title' });

      expect(status).toBe(400);
    });
  });

  // ── DELETE /services/:id ────────────────────────────────────────────────────
  describe('DELETE /services/:id', () => {
    it('should return 200 with the deactivated service', async () => {
      const deactivated = makeService({ status: ServiceStatus.INACTIVE });
      mockServicesService.delete.mockResolvedValue(deactivated);

      // FIX: UUID válido en la URL
      const { status, body } = await request(app.getHttpServer()).delete(
        `/services/${SERVICE_UUID}`,
      );

      expect(status).toBe(200);
      expect(body.status).toBe(ServiceStatus.INACTIVE);
    });

    it('should return 400 when id is not a valid UUID', async () => {
      simulatedUser = ADMIN_USER;

      const { status } = await request(app.getHttpServer()).delete(
        '/services/not-a-uuid',
      );

      expect(status).toBe(400);
    });
  });
});
