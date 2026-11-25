import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/user.decorator';
import { AppRoles } from '../auth/interfaces/app-roles';
import { User } from '../users/entities/user.entity';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth('JWT')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @Auth(AppRoles.PROVIDER, AppRoles.ADMIN)
  @ApiOperation({
    summary: 'Reporte de actividad',
    description:
      'Ingresos por mes, servicios más vendidos y órdenes por estado y por mes.',
  })
  getSummary(@GetUser() user: User) {
    return this.reportsService.getSummary(user);
  }
}
