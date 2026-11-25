import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class Verify2faDto {
  @ApiProperty({
    example: '123456',
    description:
      'Código TOTP de 6 dígitos generado por la app de autenticación.',
  })
  @IsString()
  @Length(6, 6, { message: 'El código debe tener exactamente 6 dígitos' })
  readonly token!: string;
}
