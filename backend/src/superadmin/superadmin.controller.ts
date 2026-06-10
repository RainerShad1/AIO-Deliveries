import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SuperadminService } from './superadmin.service';
import { CreateBusinessDto, UpdateBusinessDto } from './superadmin.dto';

// Todo el modulo es EXCLUSIVO del dueno de la plataforma.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('superadmin/businesses')
export class SuperadminController {
  constructor(private svc: SuperadminService) {}

  @Get()
  list() {
    return this.svc.listBusinesses();
  }

  @Post()
  create(@Body() dto: CreateBusinessDto) {
    return this.svc.createBusiness(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
    return this.svc.updateBusiness(id, dto);
  }
}
