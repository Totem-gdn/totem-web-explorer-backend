import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssetType } from 'src/assets/types/assets';
import { CurrentUser } from 'src/auth/decorators/currentUser';
import { Web3AuthGuard } from 'src/auth/guards/web3auth.guard';
import { PaymentService } from './payment.service';
import { PaymentLinkResponse } from './types/PaymentLinkResponse';
import { PaymentSystem } from './types/PaymentSystem';

@ApiTags('Payments')
@Controller()
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Post('link/:paymentSystem/:assetType')
  @UseGuards(new Web3AuthGuard(false))
  @ApiParam({ name: 'assetType', enum: ['avatar', 'item', 'gem'] })
  @ApiParam({ name: 'paymentSystem', enum: ['stripe', 'withpaper'] })
  @ApiHeader({ name: 'Authorization', required: true, description: 'Authorization token' })
  @ApiResponse({
    status: 200,
    description: 'API returns oder id and url for payment',
    type: PaymentLinkResponse,
  })
  @ApiOperation({ summary: 'API for creating an order and a payment link for buying an asset' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        successUrl: {
          type: 'string',
          description:
            'if the parameter is present - its value will be used as a link to navigate after successful payment, if the parameter is missing - the link will be taken from the environment variables',
        },
      },
    },
  })
  async createLink(
    @CurrentUser() user: string,
    @Param('assetType') assetType: AssetType,
    @Param('paymentSystem') paymentSystem: PaymentSystem,
    @Body() body,
  ) {
    if (paymentSystem == 'stripe' || paymentSystem === 'withpaper') {
      const price = await this.service.getAssetPrice(assetType);
      const order: any = await this.service.createPaymentOrder(assetType, user, price, paymentSystem);

      let url;
      if (paymentSystem === 'stripe') {
        url = await this.service.generateStripePaymentLink(price, order._id.toString(), assetType, body);
      } else {
        url = await this.service.generateWithpaperLink(assetType, user, price, order._id, body);
      }
      return { order_id: order._id, url };
    } else {
      return 'This payment system not supported';
    }
  }

  @Post('webhook/:paymentSystem')
  @UseGuards(new Web3AuthGuard(true))
  @ApiResponse({
    status: 200,
    description: 'API returns oder id and url for payment',
    type: Boolean,
  })
  @ApiOperation({ summary: 'API for process webhooks' })
  async webhook(@Param('paymentSystem') paymentSystem: PaymentSystem, @Body() body): Promise<boolean> {
    if (paymentSystem === 'stripe') {
      this.service.stripeWebhook(body);
    } else if (paymentSystem === 'withpaper') {
      this.service.withpaperWebhook(body);
    }
    return true;
  }
}
