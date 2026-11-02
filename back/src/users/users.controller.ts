import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/user.decorator';
import { AppRoles } from '../auth/interfaces/app-roles';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Obtener mi perfil' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario autenticado.' })
  getProfile(@GetUser('id') userId: string): Promise<User> {
    return this.usersService.getOneById(userId);
  }

  @Put('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado.' })
  updateProfile(
    @GetUser('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(userId, updateUserDto);
  }

  @Get()
  @Auth(AppRoles.ADMIN)
  @ApiOperation({
    summary: 'Listar todos los usuarios (ADMIN)',
    description: 'Retorna todos los usuarios activos.',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado.' })
  getAll(): Promise<User[]> {
    return this.usersService.getAll();
  }

  @Get(':id')
  @Auth(AppRoles.ADMIN)
  @ApiOperation({ summary: 'Obtener usuario por ID (ADMIN)' })
  @ApiParam({ name: 'id', description: 'UUID del usuario', type: 'string' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado.' })
  getOneById(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.getOneById(id);
  }

  @Post()
  @Auth(AppRoles.ADMIN)
  @ApiOperation({
    summary: 'Crear usuario (ADMIN)',
    description: 'Crea un usuario con los roles especificados.',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 409, description: 'El correo ya existe.' })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @Auth(AppRoles.ADMIN)
  @ApiOperation({ summary: 'Actualizar usuario (ADMIN)' })
  @ApiParam({ name: 'id', description: 'UUID del usuario', type: 'string' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/roles')
  @Auth(AppRoles.ADMIN)
  @ApiOperation({
    summary: 'Actualizar roles de usuario (ADMIN)',
    description:
      'Reemplaza los roles del usuario. Mecanismo de administración de roles.',
  })
  @ApiParam({ name: 'id', description: 'UUID del usuario', type: 'string' })
  @ApiResponse({ status: 200, description: 'Roles actualizados.' })
  @ApiResponse({ status: 400, description: 'Roles inválidos.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  updateRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserRolesDto: UpdateUserRolesDto,
  ): Promise<User> {
    return this.usersService.updateRoles(id, updateUserRolesDto);
  }

  @Delete(':id')
  @Auth(AppRoles.ADMIN)
  @ApiOperation({
    summary: 'Desactivar usuario (ADMIN)',
    description: 'Soft-delete: cambia isActive a false, no borra el registro.',
  })
  @ApiParam({ name: 'id', description: 'UUID del usuario', type: 'string' })
  @ApiResponse({ status: 200, description: 'Usuario desactivado.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.delete(id);
  }
}
