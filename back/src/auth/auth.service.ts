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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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
        where: { email, isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          roles: true,
        },
      });

      if (!usuario) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const passwordValido = bcrypt.compareSync(password, usuario.password);

      if (!passwordValido) {
        throw new UnauthorizedException('Credenciales inválidas');
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

  async logout(userId: string): Promise<{ mensaje: string }> {
    await this.userRepository.update(userId, { refreshToken: null });

    return { mensaje: 'Sesión cerrada correctamente' };
  }
}
