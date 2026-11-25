import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    description: 'UUID del servicio que se desea contratar.',
  })
  @IsUUID()
  serviceId: string;

  @ApiProperty({
    example: 250000,
    description: 'Valor total de la orden.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({
    example: 'Necesito el servicio con prioridad alta.',
    description: 'Notas opcionales de la orden.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
