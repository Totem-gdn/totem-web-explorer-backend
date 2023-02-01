import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssetType } from 'src/assets/types/assets';
import { CurrentUser } from 'src/auth/decorators/currentUser';
import { Web3AuthGuard } from 'src/auth/guards/web3auth.guard';
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

  @Post('withpaper/:assetType')
  @UseGuards(new Web3AuthGuard(false))
  async withpaper(@CurrentUser() user: string, @Param('assetType') assetType: AssetType) {
    const price = await this.service.getAssetPrice(assetType);

    const order: any = await this.service.createPaymentOrder(assetType, user, price, 'Withpaper');

    const url = await this.service.createWithpaperLink(assetType, user, price, order);

    return { url, order: order._id };
  }

  @Post('webhook/withpaper')
  @UseGuards(new Web3AuthGuard(true))
  async paperWebhook(@Body() body) {
    // console.log(body);
    // console.log(body.result?.claimedTokens?.tokens);
    return 'ok';
  }
}
