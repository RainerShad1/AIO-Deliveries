import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Un negocio es OPERATIVO si esta activo Y su suscripcion esta al dia.
// paidUntil null = exento (beta/cortesia): nunca se suspende por pago.
// paidUntil con fecha pasada = VENCIDO: invisible y sin pedidos, automatico.
const OPERATIVO = () => ({
  activo: true,
  OR: [{ paidUntil: null }, { paidUntil: { gte: new Date() } }],
});

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  // Pantalla de seleccion de negocios (Fase 2): solo negocios operativos.
  // Se expone solo lo necesario para pintar la tarjeta (sin datos internos).
  findAllPublic() {
    return this.prisma.business.findMany({
      // Marketplace: solo negocios operativos QUE quieren aparecer en la
      // lista publica. Los white-label puros (enMarketplace=false) no salen
      // aqui pero siguen operando por su app de grupo.
      where: { ...OPERATIVO(), enMarketplace: true },
      select: {
        id: true,
        slug: true,
        nombre: true,
        logo: true,
        bannerUrl: true,
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
      where: { slug, ...OPERATIVO() },
      select: {
        id: true,
        slug: true,
        nombre: true,
        logo: true,
        bannerUrl: true,
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
      where: { slug, ...OPERATIVO() },
      select: { id: true },
    });
    if (!biz) throw new NotFoundException('Negocio no encontrado');
    return biz.id;
  }

  // App white-label: el grupo (cliente) y SOLO sus negocios operativos.
  // Nota: aqui NO se filtra enMarketplace — la app propia del dueno muestra
  // sus negocios aunque esten ocultos del marketplace (ese es el punto).
  async getGroupPublic(slug: string) {
    const group = await this.prisma.clientGroup.findFirst({
      where: { slug, activo: true },
      select: {
        slug: true,
        nombre: true,
        logo: true,
        businesses: {
          where: OPERATIVO(),
          select: {
            id: true,
            slug: true,
            nombre: true,
            logo: true,
            bannerUrl: true,
            colorPrimary: true,
            colorBg: true,
            colorCard: true,
            colorAccent: true,
            horaApertura: true,
            horaCierre: true,
            abierto: true,
          },
          orderBy: { nombre: 'asc' },
        },
      },
    });
    if (!group) throw new NotFoundException('App no encontrada');
    return group;
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
