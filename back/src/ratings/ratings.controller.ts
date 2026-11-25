import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/user.decorator';
import { AppRoles } from '../auth/interfaces/app-roles';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingsService } from './ratings.service';

@ApiTags('Ratings')
@ApiBearerAuth('JWT')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @Auth(AppRoles.CLIENT)
  @ApiOperation({ summary: 'Calificar una orden completada (1 a 5)' })
  create(@GetUser('id') userId: string, @Body() dto: CreateRatingDto) {
    return this.ratingsService.create(userId, dto);
  }

  @Get('provider/:providerId')
  @Auth()
  @ApiOperation({ summary: 'Promedio de calificaciones de un proveedor' })
  getProviderSummary(@Param('providerId', ParseUUIDPipe) providerId: string) {
    return this.ratingsService.getProviderSummary(providerId);
  }
}
