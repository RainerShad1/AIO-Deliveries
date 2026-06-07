import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Publico: solo productos activos DE ESTE negocio
  findActive(businessId: string) {
    return this.prisma.product.findMany({
      where: { businessId, activo: true },
      include: { category: true },
      orderBy: { nombre: 'asc' },
    });
  }

  // Admin: todos los productos DE SU negocio
  findAll(businessId: string) {
    return this.prisma.product.findMany({
      where: { businessId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(businessId: string, dto: CreateProductDto) {
    return this.prisma.product.create({ data: { ...dto, businessId } });
  }

  async update(businessId: string, id: string, dto: UpdateProductDto) {
    // findFirst con businessId: si el producto es de otro negocio, no aparece
    const exists = await this.prisma.product.findFirst({
      where: { id, businessId },
    });
    if (!exists) throw new NotFoundException('Producto no encontrado');
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(businessId: string, id: string) {
    const exists = await this.prisma.product.findFirst({
      where: { id, businessId },
    });
    if (!exists) throw new NotFoundException('Producto no encontrado');

    // Si el producto ya esta en algun pedido, no se puede borrar fisicamente
    // (romperia el historial). En ese caso lo desactivamos (soft delete).
    const enPedidos = await this.prisma.orderItem.count({
      where: { productId: id },
    });
    if (enPedidos > 0) {
      await this.prisma.product.update({
        where: { id },
        data: { activo: false },
      });
      return { ok: true, soft: true };
    }
    await this.prisma.product.delete({ where: { id } });
    return { ok: true, soft: false };
  }

  // Helpers usados por OrdersService para validar que una categoria pertenezca
  // al negocio antes de asignarla a un producto (defensa extra, opcional).
  async assertCategoryBelongs(businessId: string, categoryId: string) {
    const cat = await this.prisma.category.findFirst({
      where: { id: categoryId, businessId },
    });
    if (!cat) throw new ForbiddenException('Categoria de otro negocio');
  }
}
