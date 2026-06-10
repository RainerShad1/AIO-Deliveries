import { Module } from '@nestjs/common';
import { SuperadminService } from './superadmin.service';
import {
  SuperadminController,
  SuperadminGroupsController,
} from './superadmin.controller';

@Module({
  controllers: [SuperadminController, SuperadminGroupsController],
  providers: [SuperadminService],
})
export class SuperadminModule {}
