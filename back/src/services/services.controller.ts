import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/user.decorator';
import { AppRoles } from '../auth/interfaces/app-roles';
import { User } from '../users/entities/user.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './entities/service.entity';
import { ServicesService } from './services.service';

@ApiTags('Services')
@ApiBearerAuth('JWT')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Auth(AppRoles.PROVIDER, AppRoles.ADMIN)
  @ApiOperation({
    summary: 'Crear servicio',
    description: 'Crea un nuevo servicio asociado al proveedor autenticado.',
  })
  @ApiResponse({ status: 201, description: 'Servicio creado.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 401, description: 'Token inválido o ausente.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado.' })
  create(
    @GetUser() user: User,
    @Body() createServiceDto: CreateServiceDto,
  ): Promise<Service> {
    return this.servicesService.create(user, createServiceDto);
  }

  @Get()
  @Auth()
  @ApiOperation({
    summary: 'Listar servicios activos',
    description:
      'Retorna todos los servicios con estado ACTIVE. Accesible para cualquier usuario autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Lista de servicios activos.' })
  @ApiResponse({ status: 401, description: 'Token inválido o ausente.' })
  getAll(): Promise<Service[]> {
    return this.servicesService.getAll();
  }

  @Get('my')
  @Auth(AppRoles.PROVIDER, AppRoles.ADMIN)
  @ApiOperation({
    summary: 'Mis servicios (PROVIDER)',
    description:
      'Retorna todos los servicios (ACTIVE e INACTIVE) del proveedor autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Servicios del proveedor.' })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado — requiere rol PROVIDER.',
  })
  getMyServices(@GetUser() user: User): Promise<Service[]> {
    return this.servicesService.getByProvider(user.id);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Obtener servicio por ID' })
  @ApiParam({ name: 'id', description: 'UUID del servicio', type: 'string' })
  @ApiResponse({ status: 200, description: 'Servicio encontrado.' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado.' })
  getOneById(@Param('id', ParseUUIDPipe) id: string): Promise<Service> {
    return this.servicesService.getOneById(id);
  }

  @Put(':id')
  @Auth(AppRoles.PROVIDER, AppRoles.ADMIN)
  @ApiOperation({
    summary: 'Actualizar servicio (PROVIDER/ADMIN)',
    description:
      'PROVIDER solo puede editar sus propios servicios y no puede cambiar `status`. ' +
      'ADMIN puede editar cualquier servicio incluyendo `status`.',
  })
  @ApiParam({ name: 'id', description: 'UUID del servicio', type: 'string' })
  @ApiResponse({ status: 200, description: 'Servicio actualizado.' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para modificar este servicio.',
  })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @GetUser() user: User,
  ): Promise<Service> {
    return this.servicesService.update(id, updateServiceDto, user);
  }

  @Delete(':id')
  @Auth(AppRoles.PROVIDER, AppRoles.ADMIN)
  @ApiOperation({
    summary: 'Eliminar servicio — soft-delete (PROVIDER/ADMIN)',
    description:
      'Cambia el estado del servicio a INACTIVE. PROVIDER solo puede eliminar los suyos.',
  })
  @ApiParam({ name: 'id', description: 'UUID del servicio', type: 'string' })
  @ApiResponse({ status: 200, description: 'Servicio desactivado.' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para eliminar este servicio.',
  })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado.' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<Service> {
    return this.servicesService.delete(id, user);
  }
}
