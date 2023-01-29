import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/orders';
import { PaymentController } from './payment.controller';

@Module({
  imports: [HttpModule, ConfigModule, MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }])],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
