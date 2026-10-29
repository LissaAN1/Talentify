import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { GetUser } from './decorators/user.decorator';
import { LoginUserDto } from './dto/login-user.dto';

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

  // TODO(HU-06): reemplazar AuthGuard('jwt') por el decorador @Auth()
  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
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

  // TODO(HU-06): reemplazar AuthGuard('jwt') por el decorador @Auth()
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
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
}
