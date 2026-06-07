import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { DeliveriesService } from './deliveries.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('deliveries')
export class DeliveriesController {
  constructor(private deliveries: DeliveriesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.deliveries.findActive(user.businessId!);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: { nombre: string; telefono: string },
  ) {
    return this.deliveries.create(user.businessId!, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.deliveries.remove(user.businessId!, id);
  }
}
