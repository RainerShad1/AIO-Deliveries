import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [BusinessModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
