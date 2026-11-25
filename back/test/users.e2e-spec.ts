import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { AppRoles } from '../src/auth/interfaces/app-roles';

describe('UsersModule (e2e)', () => {
  let app: INestApplication;

  let tokenAdmin: string;
  let tokenClient: string;

  let profileUserId: string;
  let profileUserEmail: string;

  let adminCreatedUserId: string;
  let adminCreatedUserEmail: string;

  const adminSeed = {
    email: 'admin@u.icesi.edu.co',
    password: 'Admin12345',
  };

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

    tokenAdmin = await loginAndGetToken(adminSeed.email, adminSeed.password);

    profileUserEmail = `profile-${Date.now()}@u.icesi.edu.co`;

    const profileResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Usuario Perfil',
        email: profileUserEmail,
        password: 'Password123',
      })
      .expect(201);

    profileUserId = profileResponse.body.id;
    tokenClient = await loginAndGetToken(profileUserEmail, 'Password123');
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /users/me', () => {
    it('debe retornar el perfil del usuario autenticado', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${tokenClient}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', profileUserId);
      expect(response.body).toHaveProperty('email', profileUserEmail);
      expect(response.body).not.toHaveProperty('password');
    });

    it('debe rechazar la consulta de perfil sin token', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('debe rechazar token inválido', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });
  });

  describe('PUT /users/me', () => {
    it('debe permitir actualizar el perfil propio', async () => {
      const response = await request(app.getHttpServer())
        .put('/users/me')
        .set('Authorization', `Bearer ${tokenClient}`)
        .send({
          name: 'Usuario Perfil Actualizado',
        })
        .expect(200);

      expect(response.body).toHaveProperty('id', profileUserId);
      expect(response.body).toHaveProperty(
        'name',
        'Usuario Perfil Actualizado',
      );
      expect(response.body).toHaveProperty('email', profileUserEmail);
    });

    it('debe rechazar propiedades no permitidas por ValidationPipe', async () => {
      await request(app.getHttpServer())
        .put('/users/me')
        .set('Authorization', `Bearer ${tokenClient}`)
        .send({
          name: 'Nombre Válido',
          campoNoPermitido: 'no debería pasar',
        })
        .expect(400);
    });

    it('debe rechazar actualización de perfil sin token', async () => {
      await request(app.getHttpServer())
        .put('/users/me')
        .send({
          name: 'Sin Token',
        })
        .expect(401);
    });
  });

  describe('GET /users', () => {
    it('debe permitir a ADMIN listar usuarios', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('debe rechazar a CLIENT al listar usuarios', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${tokenClient}`)
        .expect(403);
    });

    it('debe rechazar listado sin token', async () => {
      await request(app.getHttpServer()).get('/users').expect(401);
    });
  });

  describe('POST /users', () => {
    it('debe permitir a ADMIN crear un usuario con rol PROVIDER', async () => {
      adminCreatedUserEmail = `provider-${Date.now()}@u.icesi.edu.co`;

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          name: 'Proveedor Creado Por Admin',
          email: adminCreatedUserEmail,
          password: 'Password123',
          roles: [AppRoles.PROVIDER],
        })
        .expect(201);

      adminCreatedUserId = response.body.id;

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', adminCreatedUserEmail);
      expect(response.body.roles).toContain(AppRoles.PROVIDER);
    });

    it('debe rechazar creación de usuario por CLIENT', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${tokenClient}`)
        .send({
          name: 'Usuario No Autorizado',
          email: `forbidden-${Date.now()}@u.icesi.edu.co`,
          password: 'Password123',
          roles: [AppRoles.CLIENT],
        })
        .expect(403);
    });

    it('debe rechazar un correo con formato inválido', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          name: 'Correo Inválido',
          email: 'esto-no-es-un-correo',
          password: 'Password123',
          roles: [AppRoles.CLIENT],
        })
        .expect(400);
    });

    it('debe rechazar creación con email duplicado', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          name: 'Usuario Duplicado',
          email: adminCreatedUserEmail,
          password: 'Password123',
          roles: [AppRoles.PROVIDER],
        })
        .expect(409);
    });
  });

  describe('GET /users/:id', () => {
    it('debe permitir a ADMIN consultar un usuario por id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${adminCreatedUserId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', adminCreatedUserId);
      expect(response.body).toHaveProperty('email', adminCreatedUserEmail);
      expect(response.body).not.toHaveProperty('password');
    });

    it('debe rechazar id inválido por ParseUUIDPipe', async () => {
      await request(app.getHttpServer())
        .get('/users/id-invalido')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(400);
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      await request(app.getHttpServer())
        .get('/users/00000000-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(404);
    });

    it('debe rechazar a CLIENT al consultar usuario por id', async () => {
      await request(app.getHttpServer())
        .get(`/users/${adminCreatedUserId}`)
        .set('Authorization', `Bearer ${tokenClient}`)
        .expect(403);
    });
  });

  describe('PUT /users/:id', () => {
    it('debe permitir a ADMIN actualizar un usuario por id', async () => {
      const response = await request(app.getHttpServer())
        .put(`/users/${adminCreatedUserId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          name: 'Proveedor Actualizado Por Admin',
        })
        .expect(200);

      expect(response.body).toHaveProperty('id', adminCreatedUserId);
      expect(response.body).toHaveProperty(
        'name',
        'Proveedor Actualizado Por Admin',
      );
    });

    it('debe rechazar actualización con id inválido', async () => {
      await request(app.getHttpServer())
        .put('/users/id-invalido')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          name: 'No Debe Actualizar',
        })
        .expect(400);
    });

    it('debe retornar 404 al actualizar usuario inexistente', async () => {
      await request(app.getHttpServer())
        .put('/users/00000000-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          name: 'Usuario Inexistente',
        })
        .expect(404);
    });

    it('debe rechazar a CLIENT al actualizar usuario por id', async () => {
      await request(app.getHttpServer())
        .put(`/users/${adminCreatedUserId}`)
        .set('Authorization', `Bearer ${tokenClient}`)
        .send({
          name: 'No Autorizado',
        })
        .expect(403);
    });
  });

  describe('PATCH /users/:id/roles', () => {
    it('debe permitir a ADMIN actualizar roles', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${adminCreatedUserId}/roles`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          roles: [AppRoles.PROVIDER, AppRoles.CLIENT],
        })
        .expect(200);

      expect(response.body).toHaveProperty('id', adminCreatedUserId);
      expect(response.body.roles).toEqual(
        expect.arrayContaining([AppRoles.PROVIDER, AppRoles.CLIENT]),
      );
    });

    it('debe rechazar roles inválidos', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${adminCreatedUserId}/roles`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          roles: ['SUPER_ADMIN'],
        })
        .expect(400);
    });

    it('debe rechazar a CLIENT al actualizar roles', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${adminCreatedUserId}/roles`)
        .set('Authorization', `Bearer ${tokenClient}`)
        .send({
          roles: [AppRoles.ADMIN],
        })
        .expect(403);
    });
  });

  describe('DELETE /users/:id', () => {
    it('debe rechazar a CLIENT al desactivar usuario', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${adminCreatedUserId}`)
        .set('Authorization', `Bearer ${tokenClient}`)
        .expect(403);
    });

    it('debe permitir a ADMIN desactivar usuario', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/users/${adminCreatedUserId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', adminCreatedUserId);
      expect(response.body).toHaveProperty('isActive', false);
    });

    it('después de desactivar, el usuario no debe estar disponible por GET /users/:id', async () => {
      await request(app.getHttpServer())
        .get(`/users/${adminCreatedUserId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(404);
    });

    it('debe retornar 404 al desactivar usuario inexistente', async () => {
      await request(app.getHttpServer())
        .delete('/00000000-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(404);
    });
  });
});
