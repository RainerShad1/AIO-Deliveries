import { Module } from '@nestjs/common';
import { BusinessConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [BusinessModule],
  controllers: [ConfigController],
  providers: [BusinessConfigService],
  exports: [BusinessConfigService],
})
export class BusinessConfigModule {}
