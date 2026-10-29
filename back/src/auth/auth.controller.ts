import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { GetUser } from './decorators/user.decorator';
import { LoginUserDto } from './dto/login-user.dto';
import { AppRoles } from './interfaces/app-roles';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description: 'Crea una cuenta con rol CLIENT. Acepta correos de cualquier dominio.',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 409, description: 'El correo ya está registrado.' })
  registrar(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica al usuario y retorna un JWT. Si tiene 2FA activo, retorna un partialToken en su lugar.',
  })
  @ApiResponse({
    status: 201,
    description: 'Login exitoso — retorna token JWT.',
  })
  @ApiResponse({
    status: 201,
    description: 'Login con 2FA pendiente — retorna partialToken.',
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.loginUser(loginUserDto);
  }

  @Get('profile')
  @Auth()
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Obtener perfil propio',
    description: 'Retorna los datos del usuario autenticado sin la contraseña.',
  })
  @ApiResponse({ status: 200, description: 'Perfil obtenido correctamente.' })
  @ApiResponse({ status: 401, description: 'Token inválido o ausente.' })
  perfil(@GetUser() user: Omit<User, 'password'>) {
    return {
      mensaje: 'Perfil obtenido correctamente',
      usuario: user,
    };
  }

  @Post('logout')
  @Auth()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Invalida la sesión del usuario autenticado.',
  })
  @ApiResponse({ status: 201, description: 'Sesión cerrada correctamente.' })
  @ApiResponse({ status: 401, description: 'Token inválido o ausente.' })
  logout(@GetUser() user: Omit<User, 'password'>) {
    return this.authService.logout(user.id);
  }

  @Get('provider/dashboard')
  @Auth(AppRoles.PROVIDER)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Dashboard del proveedor (PROVIDER)',
    description: 'Accesible solo para usuarios con rol PROVIDER.',
  })
  @ApiResponse({ status: 200, description: 'Panel del proveedor.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado.' })
  dashboardProvider(@GetUser() user: Omit<User, 'password'>) {
    return {
      mensaje: 'Panel del proveedor',
      usuario: user,
    };
  }

  @Get('client/dashboard')
  @Auth(AppRoles.CLIENT)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Dashboard del cliente (CLIENT)',
    description: 'Accesible solo para usuarios con rol CLIENT.',
  })
  @ApiResponse({ status: 200, description: 'Panel del cliente.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado.' })
  dashboardClient(@GetUser() user: Omit<User, 'password'>) {
    return {
      mensaje: 'Panel del cliente',
      usuario: user,
    };
  }

  @Get('marketplace')
  @Auth(AppRoles.PROVIDER, AppRoles.CLIENT)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Marketplace (PROVIDER / CLIENT)',
    description: 'Accesible para PROVIDER y CLIENT. ADMIN no tiene acceso.',
  })
  @ApiResponse({ status: 200, description: 'Marketplace disponible.' })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado (ADMIN no permitido).',
  })
  marketplace(@GetUser() user: Omit<User, 'password'>) {
    return {
      mensaje: 'Marketplace disponible',
      roles: user.roles,
    };
  }
}
