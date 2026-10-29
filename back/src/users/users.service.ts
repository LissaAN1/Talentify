import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { AppRoles } from '../auth/interfaces/app-roles';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async getOneById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
    });

    if (!user) {
      throw new NotFoundException(`No se encontró un usuario con el id: ${id}`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        'Ya existe un usuario registrado con ese correo',
      );
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      roles:
        createUserDto.roles && createUserDto.roles.length > 0
          ? createUserDto.roles
          : [AppRoles.CLIENT],
      isActive: true,
      refreshToken: null,
    });

    const savedUser = await this.userRepository.save(newUser);

    return this.getOneById(savedUser.id);
  }
}
