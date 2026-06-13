import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// El horario/abierto-cerrado ahora vive POR negocio dentro de Business.
// Este servicio opera siempre sobre un businessId concreto (el del admin).
@Injectable()
export class BusinessConfigService {
  constructor(private prisma: PrismaService) {}

  // Devuelve el horario del negocio + si esta abierto ahora mismo.
  async get(businessId: string) {
    const biz = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        horaApertura: true,
        horaCierre: true,
        abierto: true,
      },
    });
    if (!biz) throw new NotFoundException('Negocio no encontrado');
    // DR is UTC-4 (no DST). Use offset instead of server local time.
    const drDate = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const hhmm = drDate.toISOString().slice(11, 16);
    const abiertoAhora =
      biz.abierto && hhmm >= biz.horaApertura && hhmm <= biz.horaCierre;
    return { ...biz, abiertoAhora };
  }

  update(
    businessId: string,
    data: Partial<{ horaApertura: string; horaCierre: string; abierto: boolean }>,
  ) {
    return this.prisma.business.update({ where: { id: businessId }, data });
  }

  // Branding editable por el admin del negocio (banner, logo, colores).
  async getBranding(businessId: string) {
    const biz = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        nombre: true,
        slug: true,
        plan: true,
        paidUntil: true,
        logo: true,
        bannerUrl: true,
        colorPrimary: true,
        colorBg: true,
        colorCard: true,
        colorAccent: true,
      },
    });
    if (!biz) throw new NotFoundException('Negocio no encontrado');
    return biz;
  }

  updateBranding(
    businessId: string,
    data: Partial<{
      bannerUrl: string;
      logo: string;
      colorPrimary: string;
      colorBg: string;
      colorCard: string;
      colorAccent: string;
    }>,
  ) {
    return this.prisma.business.update({ where: { id: businessId }, data });
  }
}
