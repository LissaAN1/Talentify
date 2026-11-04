import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AppRoles } from '../../auth/interfaces/app-roles';

export class CreateUserDto {
  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del usuario.',
  })
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres' })
  readonly name!: string;

  @ApiProperty({
    example: 'juan@gmail.com',
    description: 'Correo electrónico del usuario (cualquier dominio).',
  })
  @IsEmail({}, { message: 'Debe ingresar un correo electrónico válido' })
  @MaxLength(100, { message: 'El correo no puede superar los 100 caracteres' })
  readonly email!: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Contraseña del usuario.',
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(50, {
    message: 'La contraseña no puede superar los 50 caracteres',
  })
  readonly password!: string;

  @ApiPropertyOptional({
    enum: AppRoles,
    isArray: true,
    example: [AppRoles.CLIENT],
    description:
      'Roles asignados al usuario. En registro público, AuthService fuerza CLIENT.',
  })
  @IsOptional()
  @IsArray({ message: 'roles debe ser un arreglo' })
  @IsEnum(AppRoles, {
    each: true,
    message: 'Cada rol debe ser ADMIN, PROVIDER o CLIENT',
  })
  readonly roles?: AppRoles[];
}
