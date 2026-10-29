import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';

import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AppRoles } from './interfaces/app-roles';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

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
}
