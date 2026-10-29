import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    example: 'admin@u.icesi.edu.co',
    description: 'Correo institucional del usuario.',
  })
  @IsEmail({}, { message: 'Debe ingresar un correo electrónico válido' })
  @MaxLength(100, { message: 'El correo no puede superar los 100 caracteres' })
  readonly email!: string;

  @ApiProperty({
    example: 'Admin12345',
    description: 'Contraseña del usuario.',
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(50, {
    message: 'La contraseña no puede superar los 50 caracteres',
  })
  readonly password!: string;
}
