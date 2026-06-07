import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { AddressDto } from './dto/address.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@Req() req) {
    return this.users.getProfile(req.user.userId);
  }

  @Patch('me')
  updateMe(
    @Req() req,
    @Body() dto: { nombre?: string; telefono?: string; password?: string },
  ) {
    return this.users.updateProfile(req.user.userId, dto);
  }

  @Get('me/addresses')
  addresses(@Req() req) {
    return this.users.listAddresses(req.user.userId);
  }

  @Post('me/addresses')
  addAddress(@Req() req, @Body() dto: AddressDto) {
    return this.users.addAddress(req.user.userId, dto);
  }

  @Delete('me/addresses/:id')
  removeAddress(@Req() req, @Param('id') id: string) {
    return this.users.removeAddress(req.user.userId, id);
  }

  // ===== Solo ADMIN: recuperacion de contrasena asistida =====
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('search')
  search(@Query('q') q: string) {
    return this.users.searchClients(q || '');
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/reset-password')
  resetPassword(@Param('id') id: string, @Body() body: { password: string }) {
    return this.users.resetPassword(id, body.password);
  }
}
