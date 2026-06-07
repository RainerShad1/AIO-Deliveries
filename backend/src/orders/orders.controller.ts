import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user.userId, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.orders.findMine(user.userId);
  }

  // ---- Endpoints ADMIN (antes de :id para evitar colision de rutas) ----

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll(@CurrentUser() user: AuthUser) {
    return this.orders.findAll(user.businessId!);
  }

  @Get('reports/today')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  today(@CurrentUser() user: AuthUser) {
    return this.orders.findToday(user.businessId!);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orders.getOne(id, user.userId, user.role, user.businessId);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.orders.updateStatus(user.businessId!, id, status);
  }

  @Patch(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  assign(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('deliveryId') deliveryId: string,
  ) {
    return this.orders.assignDelivery(user.businessId!, id, deliveryId);
  }
}
