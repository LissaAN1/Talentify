import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Auth + Users integration (e2e)', () => {
  let app: INestApplication;

  let tokenAdmin: string;
  let tokenProvider: string;
  let tokenClient: string;

  const seedUsers = {
    admin: {
      email: 'admin@u.icesi.edu.co',
      password: 'Admin12345',
      role: 'ADMIN',
    },
    provider: {
      email: 'provider@u.icesi.edu.co',
      password: 'Provider12345',
      role: 'PROVIDER',
    },
    client: {
      email: 'client@u.icesi.edu.co',
      password: 'Client12345',
      role: 'CLIENT',
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    tokenAdmin = await loginAndGetToken(
      seedUsers.admin.email,
      seedUsers.admin.password,
    );

    tokenProvider = await loginAndGetToken(
      seedUsers.provider.email,
      seedUsers.provider.password,
    );

    tokenClient = await loginAndGetToken(
      seedUsers.client.email,
      seedUsers.client.password,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  const loginAndGetToken = async (
    email: string,
    password: string,
  ): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('usuario');
    expect(response.body.usuario).toHaveProperty('correo', email);

    return response.body.token;
  };

  describe('/auth/register', () => {
    it('debe registrar un usuario nuevo con correo institucional y rol CLIENT por defecto', async () => {
      const email = `test-auth-${Date.now()}@u.icesi.edu.co`;

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Usuario Test',
          email,
          password: 'Test123456',
          roles: ['ADMIN'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', email);
      expect(response.body).not.toHaveProperty('password');

      // AuthService fuerza CLIENT aunque el request mande ADMIN.
      expect(response.body.roles).toContain('CLIENT');
      expect(response.body.roles).not.toContain('ADMIN');
    });

    it('debe aceptar correos de cualquier dominio', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Correo Externo',
          email: `test-${Date.now()}@talentify.com`,
          password: 'Test123456',
          roles: ['CLIENT'],
        })
        .expect(201);
    });

    it('debe rechazar un correo con formato inválido', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Correo Incorrecto',
          email: 'esto-no-es-un-correo',
          password: 'Test123456',
          roles: ['CLIENT'],
        })
        .expect(400);
    });

    it('debe fallar si el correo ya existe', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Admin Repetido',
          email: seedUsers.admin.email,
          password: 'Admin12345',
          roles: ['ADMIN'],
        })
        .expect(409);
    });
  });

  describe('/auth/login', () => {
    it('debe iniciar sesión correctamente con usuario ADMIN del seed', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: seedUsers.admin.email,
          password: seedUsers.admin.password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('usuario');
      expect(response.body.usuario).toHaveProperty(
        'correo',
        seedUsers.admin.email,
      );
      expect(response.body.usuario.roles).toContain('ADMIN');
    });

    it('debe fallar con contraseña inválida', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: seedUsers.admin.email,
          password: 'ClaveIncorrecta',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('debe fallar con usuario inexistente', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'noexiste@u.icesi.edu.co',
          password: 'Test123456',
        })
        .expect(401);
    });
  });

  describe('rutas protegidas por JWT', () => {
    it('/auth/profile debe obtener perfil con token válido', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(response.body).toHaveProperty(
        'mensaje',
        'Perfil obtenido correctamente',
      );
      expect(response.body).toHaveProperty('usuario');
      expect(response.body.usuario).not.toHaveProperty('password');
    });

    it('/auth/profile debe fallar sin token', async () => {
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('/auth/profile debe fallar con token inválido', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });
  });

  describe('autorización por roles', () => {
    it('ADMIN debe poder listar usuarios en /users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('CLIENT no debe poder listar usuarios en /users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${tokenClient}`)
        .expect(403);
    });

    it('PROVIDER debe acceder a /auth/provider/dashboard', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/provider/dashboard')
        .set('Authorization', `Bearer ${tokenProvider}`)
        .expect(200);

      expect(response.body).toHaveProperty('mensaje', 'Panel del proveedor');
      expect(response.body.usuario.roles).toContain('PROVIDER');
    });

    // it('CLIENT no debe acceder a /auth/provider/dashboard', async () => {
    //   await request(app.getHttpServer())
    //     .get('/auth/provider/dashboard')
    //     .set('Authorization', `Bearer ${tokenClient}`)
    //     .expect(403);
    // });

    it('CLIENT debe acceder a /auth/client/dashboard', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/client/dashboard')
        .set('Authorization', `Bearer ${tokenClient}`)
        .expect(200);

      expect(response.body).toHaveProperty('mensaje', 'Panel del cliente');
      expect(response.body.usuario.roles).toContain('CLIENT');
    });

    it('PROVIDER no debe acceder a /auth/client/dashboard', async () => {
      await request(app.getHttpServer())
        .get('/auth/client/dashboard')
        .set('Authorization', `Bearer ${tokenProvider}`)
        .expect(403);
    });

    it('PROVIDER debe acceder a /auth/marketplace', async () => {
      await request(app.getHttpServer())
        .get('/auth/marketplace')
        .set('Authorization', `Bearer ${tokenProvider}`)
        .expect(200);
    });

    it('CLIENT debe acceder a /auth/marketplace', async () => {
      await request(app.getHttpServer())
        .get('/auth/marketplace')
        .set('Authorization', `Bearer ${tokenClient}`)
        .expect(200);
    });

    // it('ADMIN no debe acceder a /auth/marketplace porque esa ruta es CLIENT/PROVIDER', async () => {
    //   await request(app.getHttpServer())
    //     .get('/auth/marketplace')
    //     .set('Authorization', `Bearer ${tokenAdmin}`)
    //     .expect(403);
    // });
  });

  describe('/auth/logout', () => {
    it('debe cerrar sesión correctamente con token válido', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${tokenClient}`)
        .expect(201);

      expect(response.body).toHaveProperty(
        'mensaje',
        'Sesión cerrada correctamente',
      );
    });

    it('debe rechazar logout sin token', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });
  });
});
