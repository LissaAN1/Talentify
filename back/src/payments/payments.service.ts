import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Repository } from 'typeorm';

import { Order, OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class PaymentsService {
  private stripeClient?: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  // El cliente de Stripe se crea al primer uso: así la aplicación (y sus
  // pruebas) arranca aunque STRIPE_SECRET_KEY no esté definida.
  private get stripe(): Stripe {
    // Clave de pruebas (sk_test_...) de la cuenta sandbox de Stripe
    this.stripeClient ??= new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
    );
    return this.stripeClient;
  }

  // Crea la sesión de pago de Stripe Checkout para una orden PENDING
  async createCheckoutSession(orderId: string, userId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { user: true, service: true },
    });

    if (!order) {
      throw new NotFoundException(`Orden con id ${orderId} no encontrada`);
    }

    if (order.user.id !== userId) {
      throw new ForbiddenException('No tienes permiso para pagar esta orden');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Solo se pueden pagar órdenes en estado PENDING',
      );
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'cop',
            unit_amount: Math.round(Number(order.totalAmount) * 100),
            product_data: { name: order.service.title },
          },
        },
      ],
      metadata: { orderId: order.id },
      success_url: `${frontendUrl}/orders/${order.id}?payment=success`,
      cancel_url: `${frontendUrl}/orders/${order.id}?payment=cancelled`,
    });

    return { url: session.url };
  }

  // Stripe llama a este método (Webhook) cuando el pago se confirma
  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET'),
      );
    } catch {
      throw new BadRequestException('Firma de Stripe inválida');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        // Solo avanza PENDING -> PAID (respeta el flujo de estados)
        await this.orderRepository.update(
          { id: orderId, status: OrderStatus.PENDING },
          { status: OrderStatus.PAID },
        );
      }
    }

    return { received: true };
  }
}
