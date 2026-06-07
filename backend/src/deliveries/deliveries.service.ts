import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeliveriesService {
  constructor(private prisma: PrismaService) {}

  // Solo los repartidores activos DE SU negocio
  findActive(businessId: string) {
    return this.prisma.delivery.findMany({
      where: { businessId, activo: true },
    });
  }

  create(businessId: string, data: { nombre: string; telefono: string }) {
    return this.prisma.delivery.create({ data: { ...data, businessId } });
  }

  async remove(businessId: string, id: string) {
    const delivery = await this.prisma.delivery.findFirst({
      where: { id, businessId },
    });
    if (!delivery) throw new NotFoundException('Delivery no encontrado');

    // Con pedidos asociados -> soft delete (preserva historial). Sin pedidos -> borrado real.
    const pedidos = await this.prisma.order.count({ where: { deliveryId: id } });
    if (pedidos > 0) {
      await this.prisma.delivery.update({
        where: { id },
        data: { activo: false },
      });
    } else {
      await this.prisma.delivery.delete({ where: { id } });
    }
    return { ok: true };
  }
}
