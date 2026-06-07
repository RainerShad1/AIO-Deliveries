import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { BusinessConfigService } from './config.service';
import { BusinessService } from '../business/business.service';

@Controller('config')
export class ConfigController {
  constructor(
    private config: BusinessConfigService,
    private business: BusinessService,
  ) {}

  // Publico: el cliente consulta el horario del negocio que esta navegando
  // (identificado por slug). Ej: GET /config?business=super-empanada
  @Get()
  async get(@Query('business') slug: string) {
    const businessId = await this.business.resolveId(slug);
    return this.config.get(businessId);
  }

  // Admin: edita el horario de SU negocio (businessId sale del token)
  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @CurrentUser() user: AuthUser,
    @Body()
    body: Partial<{ horaApertura: string; horaCierre: string; abierto: boolean }>,
  ) {
    return this.config.update(user.businessId!, body);
  }
}
