import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';

@ApiTags('Payments')
@Controller()
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Post('liqpay')
  @ApiResponse({
    status: 200,
    description: 'Boolean variable',
    type: Boolean,
    isArray: true,
  })
  @ApiOperation({ summary: 'Liqpay webhook endpoint' })
  async liqpay(@Body() body): Promise<boolean> {
    this.service.liqpayWebhook(body);
    return true;
  }

  @Post('stripe')
  @ApiResponse({
    status: 200,
    description: 'Boolean variable',
    type: Boolean,
    isArray: true,
  })
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async stripe(@Body() body): Promise<boolean> {
    this.service.stripeWebhook(body);
    return true;
  }
}
