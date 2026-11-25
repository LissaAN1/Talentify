import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/user.decorator';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout/:orderId')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Crear sesión de pago en Stripe',
    description:
      'Retorna la URL de Stripe Checkout para pagar una orden PENDING.',
  })
  checkout(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @GetUser('id') userId: string,
  ) {
    return this.paymentsService.createCheckoutSession(orderId, userId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de Stripe',
    description:
      'Lo llama Stripe al confirmar el pago; marca la orden como PAID.',
  })
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('No se recibió el cuerpo de la petición');
    }
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }
}
