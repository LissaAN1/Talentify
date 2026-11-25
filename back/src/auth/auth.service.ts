import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from './dto/login-user.dto';
import { AppRoles } from './interfaces/app-roles';
import { TwoFactorAuthService } from './two-factor-auth.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) {}

  private generarToken(userId: string): string {
    return this.jwtService.sign({ user_id: userId });
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      return await this.usersService.create({
        ...createUserDto,
        roles: [AppRoles.CLIENT],
      });
    } catch (error) {
      if (error instanceof ConflictException) throw error;

      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';

      throw new BadRequestException(
        `Error al crear el usuario: ${errorMessage}`,
      );
    }
  }

  async loginUser(loginUserDto: LoginUserDto) {
    try {
      const { email, password } = loginUserDto;

      const usuario = await this.userRepository.findOne({
        where: {
          email,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          roles: true,
          isTwoFactorEnabled: true,
        },
      });

      if (!usuario) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const passwordValido = bcrypt.compareSync(password, usuario.password);

      if (!passwordValido) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      //Si tiene 2FA activo, no crea el JWR aun
      if (usuario.isTwoFactorEnabled) {
        const partialToken = this.jwtService.sign(
          { user_id: usuario.id, is2FAPending: true },
          { expiresIn: '5m' },
        );
        return {
          requires2FA: true,
          partialToken, // El frontend envia este token en el header para POST /auth/2fa/verificar
        };
      }

      return {
        usuario: {
          id: usuario.id,
          nombre: usuario.name,
          correo: usuario.email,
          roles: usuario.roles,
        },
        token: this.generarToken(usuario.id),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;

      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';

      throw new BadRequestException(`Error al iniciar sesión: ${errorMessage}`);
    }
  }

  // El usuario autenticado pide generar su QR
  async generar2faSecret(user: Omit<User, 'password'>) {
    const secret = this.twoFactorAuthService.generateSecret(user.email);

    // Guarda el secret en BD (2FA todavía NO está activo hasta que el usuario confirme)
    await this.userRepository.update(user.id, {
      twoFactorSecret: secret.base32,
    });

    if (!secret.otpauth_url) {
      throw new BadRequestException('No se pudo generar la URL para el QR 2FA');
    }

    const qrCode = await this.twoFactorAuthService.generateQrCodeDataUrl(
      secret.otpauth_url,
    );

    return { qrCode }; // El frontend renderiza este base64 como <img src={qrCode}>
  }

  // El usuario escanea el QR con su app y envía el primer código para confirmar
  async habilitar2fa(user: Omit<User, 'password'>, token: string) {
    // twoFactorSecret tiene select:false por defecto, necesitamos traerlo explícitamente
    const usuarioConSecret = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.twoFactorSecret')
      .where('user.id = :id', { id: user.id })
      .getOne();

    if (!usuarioConSecret?.twoFactorSecret) {
      throw new BadRequestException(
        'Primero debes generar el QR en GET /auth/2fa/generar',
      );
    }

    const esValido = this.twoFactorAuthService.verifyToken(
      usuarioConSecret.twoFactorSecret,
      token,
    );

    if (!esValido) throw new UnauthorizedException('Código 2FA inválido');

    await this.userRepository.update(user.id, { isTwoFactorEnabled: true });
    return { mensaje: '2FA habilitado correctamente' };
  }

  // Segundo paso del login cuando 2FA está activo
  async verificar2fa(user: Omit<User, 'password'>, token: string) {
    const usuarioConSecret = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.twoFactorSecret')
      .where('user.id = :id', { id: user.id })
      .getOne();

    if (!usuarioConSecret?.twoFactorSecret) {
      throw new BadRequestException('Este usuario no tiene 2FA configurado');
    }

    const esValido = this.twoFactorAuthService.verifyToken(
      usuarioConSecret.twoFactorSecret,
      token,
    );

    if (!esValido) throw new UnauthorizedException('Código 2FA inválido');

    // Ahora sí emitimos el JWT final completo
    return {
      usuario: {
        id: user.id,
        nombre: user.name,
        correo: user.email,
        roles: user.roles,
      },
      token: this.generarToken(user.id),
    };
  }

  async logout(userId: string): Promise<{ mensaje: string }> {
    await this.userRepository.update(userId, { refreshToken: null });

    return {
      mensaje: 'Sesión cerrada correctamente',
    };
  }
}
