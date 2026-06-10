import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto, UpdateBusinessDto } from './superadmin.dto';

@Injectable()
export class SuperadminService {
  constructor(private prisma: PrismaService) {}

  // Lista de todos los negocios (activos y suspendidos) con metricas basicas.
  async listBusinesses() {
    const businesses = await this.prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        admins: {
          select: { id: true, nombre: true, cedula: true, telefono: true },
        },
        _count: { select: { orders: true, products: true } },
      },
    });
    return businesses;
  }

  // Alta de negocio + su admin inicial, en UNA transaccion: si falla algo,
  // no queda un negocio sin admin ni un admin colgando.
  async createBusiness(dto: CreateBusinessDto) {
    const slugTaken = await this.prisma.business.findUnique({
      where: { slug: dto.slug },
    });
    if (slugTaken) throw new ConflictException('Ese slug ya esta en uso');

    const cedulaTaken = await this.prisma.user.findUnique({
      where: { cedula: dto.adminCedula },
    });
    if (cedulaTaken)
      throw new ConflictException('La cedula del admin ya esta registrada');

    const hash = await bcrypt.hash(dto.adminPassword, 10);

    return this.prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          nombre: dto.nombre,
          slug: dto.slug,
          colorPrimary: dto.colorPrimary ?? undefined,
          colorBg: dto.colorBg ?? undefined,
          colorCard: dto.colorCard ?? undefined,
          colorAccent: dto.colorAccent ?? undefined,
        },
      });
      const admin = await tx.user.create({
        data: {
          cedula: dto.adminCedula,
          password: hash,
          nombre: dto.adminNombre,
          telefono: dto.adminTelefono,
          role: 'ADMIN',
          businessId: business.id,
        },
        select: { id: true, nombre: true, cedula: true },
      });
      return { business, admin };
    });
  }

  // Suspender/reactivar o renombrar. Suspender (activo=false) saca al negocio
  // de la lista publica y bloquea pedidos nuevos (resolveId filtra activo).
  async updateBusiness(id: string, dto: UpdateBusinessDto) {
    const exists = await this.prisma.business.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Negocio no encontrado');
    return this.prisma.business.update({ where: { id }, data: dto });
  }
}
