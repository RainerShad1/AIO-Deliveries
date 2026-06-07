import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';

@Module({
  controllers: [BusinessController],
  providers: [BusinessService],
  exports: [BusinessService], // products/orders/etc. lo usan para resolver slug
})
export class BusinessModule {}
