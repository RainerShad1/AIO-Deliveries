import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersGateway } from './orders.gateway';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [BusinessModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersGateway],
})
export class OrdersModule {}
