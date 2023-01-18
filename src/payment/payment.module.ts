import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { LiqpayOrder, LiqpayOrderSchema } from './schemas/liqpayOrders';
import { PaymentController } from './payment.controller';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    MongooseModule.forFeature([{ name: LiqpayOrder.name, schema: LiqpayOrderSchema }]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
