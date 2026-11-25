import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({ description: 'Id de la orden COMPLETED que se califica.' })
  @IsUUID()
  readonly orderId!: string;

  @ApiProperty({ example: 5, description: 'Puntaje de 1 a 5.' })
  @IsInt({ message: 'El puntaje debe ser un número entero' })
  @Min(1, { message: 'El puntaje mínimo es 1' })
  @Max(5, { message: 'El puntaje máximo es 5' })
  readonly score!: number;

  @ApiPropertyOptional({ example: 'Excelente trabajo y muy puntual.' })
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'El comentario no puede superar los 500 caracteres',
  })
  readonly comment?: string;
}
