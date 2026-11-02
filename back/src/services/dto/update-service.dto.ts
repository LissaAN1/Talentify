import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ServiceCategory, ServiceStatus } from '../entities/service.entity';

export class UpdateServiceDto {
  @ApiPropertyOptional({
    example: 'Diseño de logo actualizado',
    description: 'Título actualizado del servicio.',
  })
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
  @MaxLength(100, { message: 'El título no puede superar los 100 caracteres' })
  readonly title?: string;

  @ApiPropertyOptional({
    example: 'Descripción actualizada del servicio freelance.',
    description: 'Descripción actualizada del servicio.',
  })
  @IsOptional()
  @IsString()
  @MinLength(10, {
    message: 'La descripción debe tener al menos 10 caracteres',
  })
  @MaxLength(1000, {
    message: 'La descripción no puede superar los 1000 caracteres',
  })
  readonly description?: string;

  @ApiPropertyOptional({
    example: 300000,
    description: 'Precio actualizado del servicio.',
  })
  @IsOptional()
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  readonly price?: number;

  @ApiPropertyOptional({
    enum: ServiceCategory,
    example: ServiceCategory.PROGRAMMING,
    description: `Categoría actualizada del servicio. Valores permitidos: ${Object.values(ServiceCategory).join(', ')}`,
  })
  @IsOptional()
  @IsEnum(ServiceCategory, {
    message: `La categoría debe ser una de: ${Object.values(ServiceCategory).join(', ')}`,
  })
  readonly category?: ServiceCategory;

  @ApiPropertyOptional({
    enum: ServiceStatus,
    example: ServiceStatus.ACTIVE,
    description: 'Estado del servicio. Solo un administrador puede cambiarlo.',
  })
  @IsOptional()
  @IsEnum(ServiceStatus, {
    message: `El estado debe ser ACTIVE o INACTIVE`,
  })
  readonly status?: ServiceStatus;
}
