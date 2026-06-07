import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  // Pantalla de seleccion de negocios (Fase 2): solo negocios activos.
  // Se expone solo lo necesario para pintar la tarjeta (sin datos internos).
  findAllPublic() {
    return this.prisma.business.findMany({
      where: { activo: true },
      select: {
        id: true,
        slug: true,
        nombre: true,
        logo: true,
        colorPrimary: true,
        colorBg: true,
        colorCard: true,
        colorAccent: true,
        horaApertura: true,
        horaCierre: true,
        abierto: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async getBySlugPublic(slug: string) {
    const biz = await this.prisma.business.findFirst({
      where: { slug, activo: true },
      select: {
        id: true,
        slug: true,
        nombre: true,
        logo: true,
        colorPrimary: true,
        colorBg: true,
        colorCard: true,
        colorAccent: true,
        horaApertura: true,
        horaCierre: true,
        abierto: true,
      },
    });
    if (!biz) throw new NotFoundException('Negocio no encontrado');
    return biz;
  }

  // Resuelve slug -> businessId para los endpoints publicos del cliente.
  // Lanza 404 si el negocio no existe o esta inactivo (suspendido).
  async resolveId(slug: string): Promise<string> {
    const biz = await this.prisma.business.findFirst({
      where: { slug, activo: true },
      select: { id: true },
    });
    if (!biz) throw new NotFoundException('Negocio no encontrado');
    return biz.id;
  }

  // ¿El negocio esta abierto ahora? (reemplaza al viejo BusinessConfig global)
  async isOpen(businessId: string): Promise<boolean> {
    const biz = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { abierto: true, horaApertura: true, horaCierre: true },
    });
    if (!biz || !biz.abierto) return false; // inexistente o cierre manual
    const hhmm = new Date().toTimeString().slice(0, 5); // "HH:mm"
    return hhmm >= biz.horaApertura && hhmm <= biz.horaCierre;
  }
}
