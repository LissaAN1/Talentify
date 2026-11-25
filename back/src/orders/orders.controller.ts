import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/user.decorator';
import type { Order } from './entities/order.entity';

@ApiTags('Orders')
@ApiBearerAuth('JWT')
@UseGuards(AuthGuard())
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear orden',
    description: 'Crea una nueva orden de servicio con estado inicial PENDING.',
  })
  @ApiResponse({ status: 201, description: 'Orden creada con estado PENDING.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 401, description: 'Token inválido o ausente.' })
  create(
    @GetUser() user: any,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    return this.ordersService.create(user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar mis órdenes',
    description:
      'Retorna todas las órdenes del usuario autenticado, ordenadas por fecha descendente.',
  })
  @ApiResponse({ status: 200, description: 'Lista de órdenes del usuario.' })
  @ApiResponse({ status: 401, description: 'Token inválido o ausente.' })
  getAll(@GetUser() user: any): Promise<Order[]> {
    return this.ordersService.getAll(user.id);
  }

  @Get('provider')
  @ApiOperation({
    summary: 'Listar órdenes recibidas por el proveedor',
    description:
      'Retorna las órdenes asociadas a servicios del proveedor autenticado.',
  })
  getProviderOrders(@GetUser() user: any): Promise<Order[]> {
    return this.ordersService.getByProvider(user.id);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Obtener orden por ID' })
  @ApiParam({
    name: 'orderId',
    description: 'UUID de la orden',
    type: 'string',
  })
  @ApiResponse({ status: 200, description: 'Orden encontrada.' })
  @ApiResponse({
    status: 403,
    description: 'La orden pertenece a otro usuario.',
  })
  @ApiResponse({ status: 404, description: 'Orden no encontrada.' })
  getById(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @GetUser() user: any,
  ): Promise<Order> {
    return this.ordersService.getById(orderId, user.id);
  }
}
