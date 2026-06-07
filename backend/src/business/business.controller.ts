import { Controller, Get, Param } from '@nestjs/common';
import { BusinessService } from './business.service';

// Endpoints publicos: el cliente lista negocios y entra a uno.
@Controller('businesses')
export class BusinessController {
  constructor(private business: BusinessService) {}

  @Get() // publico: pantalla de seleccion de negocios
  findAll() {
    return this.business.findAllPublic();
  }

  @Get(':slug') // publico: branding del negocio al entrar a su tienda
  getOne(@Param('slug') slug: string) {
    return this.business.getBySlugPublic(slug);
  }
}
