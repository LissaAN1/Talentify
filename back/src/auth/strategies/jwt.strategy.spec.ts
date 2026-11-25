import type { Mock } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from '../../users/entities/user.entity';
import { AppRoles } from '../interfaces/app-roles';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: { findOne: Mock };

  const user: User = {
    id: 'user-id',
    name: 'Usuario Test',
    email: 'test@u.icesi.edu.co',
    password: 'hashed-password',
    roles: [AppRoles.CLIENT],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    refreshToken: null,
  };

  beforeEach(async () => {
    userRepository = {
      findOne: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('debe estar definida', () => {
    expect(strategy).toBeDefined();
  });

  it('debe validar payload y retornar usuario sin password', async () => {
    userRepository.findOne.mockResolvedValue(user);

    const result = await strategy.validate({ user_id: user.id });

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: user.id,
        isActive: true,
      },
    });

    expect(result).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      refreshToken: user.refreshToken,
    });

    expect(result).not.toHaveProperty('password');
  });

  it('debe lanzar UnauthorizedException si el usuario no existe o está inactivo', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(strategy.validate({ user_id: 'missing-id' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe fallar al construir si JWT_SECRET no está definido', async () => {
    await expect(
      Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: ConfigService,
            useValue: {
              get: vi.fn().mockReturnValue(undefined),
            },
          },
          {
            provide: getRepositoryToken(User),
            useValue: userRepository,
          },
        ],
      }).compile(),
    ).rejects.toThrow('JWT_SECRET no está definido');
  });

  it('debe solicitar JWT_SECRET al ConfigService al construir la estrategia', async () => {
    const configGet = vi.fn().mockReturnValue('test-secret');

    await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: configGet,
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    expect(configGet).toHaveBeenCalledWith('JWT_SECRET');
  });

  it('debe validar payload con campos adicionales y retornar usuario sin password', async () => {
    userRepository.findOne.mockResolvedValue(user);

    const result = await strategy.validate({
      user_id: user.id,
      is2FAPending: true,
    } as any);

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: user.id,
        isActive: true,
      },
    });

    expect(result).not.toHaveProperty('password');
    expect(result).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      refreshToken: user.refreshToken,
    });
  });

  it('debe lanzar UnauthorizedException si el payload contiene un user_id válido en formato pero no existe usuario activo', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(
      strategy.validate({ user_id: 'inactive-user-id' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 'inactive-user-id',
        isActive: true,
      },
    });
  });
});
