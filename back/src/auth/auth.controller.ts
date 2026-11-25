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
import { Verify2faDto } from './dto/verify-2fa.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description:
      'Crea una cuenta con rol CLIENT. El correo debe ser institucional (@u.icesi.edu.co).',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o correo no institucional.',
  })
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

  @Get('2fa/generar')
  @Auth() // requiere JWT válido (el usuario ya inició sesión normalmente)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Generar QR para 2FA',
    description:
      'Genera un secret TOTP y retorna un QR en base64 para escanear con una app de autenticación (Google Authenticator, Authy, etc.).',
  })
  @ApiResponse({
    status: 200,
    description: 'QR generado — retorna `{ qrCode: string }` en base64.',
  })
  @ApiResponse({ status: 401, description: 'Token inválido o ausente.' })
  generar2fa(@GetUser() user: Omit<User, 'password'>) {
    return this.authService.generar2faSecret(user);
  }

  @Post('2fa/habilitar')
  @Auth() // requiere JWT válido; el usuario ya escaneó el QR y envía su primer código
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Habilitar 2FA',
    description:
      'Activa el 2FA para el usuario validando el primer código TOTP generado por la app de autenticación.',
  })
  @ApiResponse({ status: 200, description: '2FA habilitado correctamente.' })
  @ApiResponse({ status: 401, description: 'Código 2FA inválido.' })
  habilitar2fa(
    @GetUser() user: Omit<User, 'password'>,
    @Body() body: Verify2faDto,
  ) {
    return this.authService.habilitar2fa(user, body.token);
  }

  @Post('2fa/verificar')
  @Auth() // requiere el partialToken recibido en el login
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Verificar código 2FA en el login',
    description:
      'Segundo paso del login cuando 2FA está activo. Enviar el partialToken en el header y el código TOTP en el body.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verificación exitosa — retorna JWT completo.',
  })
  @ApiResponse({ status: 401, description: 'Código 2FA inválido.' })
  verificar2fa(
    @GetUser() user: Omit<User, 'password'>,
    @Body() body: Verify2faDto,
  ) {
    return this.authService.verificar2fa(user, body.token);
  }
}
