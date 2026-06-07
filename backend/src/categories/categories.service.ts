import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // Publico: categorias activas DE ESTE negocio, ordenadas
  findActive(businessId: string) {
    return this.prisma.category.findMany({
      where: { businessId, activa: true },
      orderBy: { orden: 'asc' },
    });
  }

  // Admin: todas las DE SU negocio
  findAll(businessId: string) {
    return this.prisma.category.findMany({
      where: { businessId },
      orderBy: { orden: 'asc' },
    });
  }

  create(businessId: string, data: { nombre: string; orden?: number }) {
    return this.prisma.category.create({
      data: { businessId, nombre: data.nombre, orden: data.orden ?? 0 },
    });
  }

  async update(
    businessId: string,
    id: string,
    data: { nombre?: string; orden?: number },
  ) {
    const exists = await this.prisma.category.findFirst({
      where: { id, businessId },
    });
    if (!exists) throw new NotFoundException('Categoria no encontrada');
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(businessId: string, id: string) {
    const exists = await this.prisma.category.findFirst({
      where: { id, businessId },
    });
    if (!exists) throw new NotFoundException('Categoria no encontrada');
    // Los productos de esta categoria quedan sin categoria (no se borran).
    await this.prisma.product.updateMany({
      where: { categoryId: id, businessId },
      data: { categoryId: null },
    });
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }
}
