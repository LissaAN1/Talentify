import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ServiceCategory } from '../entities/service.entity';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Diseño de logo profesional',
    description: 'Título del servicio.',
  })
  @IsString()
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
  @MaxLength(100, { message: 'El título no puede superar los 100 caracteres' })
  readonly title!: string;

  @ApiProperty({
    example:
      'Creación de logo profesional para emprendimientos, marcas personales o proyectos universitarios.',
    description: 'Descripción detallada del servicio.',
  })
  @IsString()
  @MinLength(10, {
    message: 'La descripción debe tener al menos 10 caracteres',
  })
  @MaxLength(1000, {
    message: 'La descripción no puede superar los 1000 caracteres',
  })
  readonly description!: string;

  @ApiProperty({
    example: 250000,
    description: 'Precio del servicio.',
  })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  readonly price!: number;

  @ApiProperty({
    enum: ServiceCategory,
    example: ServiceCategory.DESIGN,
    description: `Categoría del servicio. Valores permitidos: ${Object.values(ServiceCategory).join(', ')}`,
  })
  @IsEnum(ServiceCategory, {
    message: `La categoría debe ser una de: ${Object.values(ServiceCategory).join(', ')}`,
  })
  readonly category!: ServiceCategory;
}
