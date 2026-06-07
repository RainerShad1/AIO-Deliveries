import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { CategoriesService } from './categories.service';
import { BusinessService } from '../business/business.service';

@Controller('categories')
export class CategoriesController {
  constructor(
    private categories: CategoriesService,
    private business: BusinessService,
  ) {}

  // Publico: GET /categories?business=super-empanada
  @Get()
  async findActive(@Query('business') slug: string) {
    const businessId = await this.business.resolveId(slug);
    return this.categories.findActive(businessId);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll(@CurrentUser() user: AuthUser) {
    return this.categories.findAll(user.businessId!);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: { nombre: string; orden?: number },
  ) {
    return this.categories.create(user.businessId!, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { nombre?: string; orden?: number },
  ) {
    return this.categories.update(user.businessId!, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.categories.remove(user.businessId!, id);
  }
}
