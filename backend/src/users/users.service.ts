import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AddressDto } from './dto/address.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        telefono: true,
        role: true,
        addresses: { where: { activa: true } },
      },
    });
  }

  listAddresses(userId: string) {
    // Solo direcciones activas (no las ocultadas por soft delete)
    return this.prisma.address.findMany({
      where: { userId, activa: true },
    });
  }

  addAddress(userId: string, dto: AddressDto) {
    return this.prisma.address.create({ data: { ...dto, userId } });
  }

  async removeAddress(userId: string, addressId: string) {
    const addr = await this.prisma.address.findFirst({
      where: { id: addressId, userId }, // garantiza que sea del usuario
    });
    if (!addr) throw new NotFoundException('Direccion no encontrada');

    // Si la direccion ya fue usada en algun pedido, no se puede borrar
    // fisicamente (rompe el historial). En ese caso, soft delete: la ocultamos.
    const pedidosConEsta = await this.prisma.order.count({
      where: { addressId },
    });

    if (pedidosConEsta > 0) {
      await this.prisma.address.update({
        where: { id: addressId },
        data: { activa: false },
      });
    } else {
      // Sin pedidos asociados: borrado real
      await this.prisma.address.delete({ where: { id: addressId } });
    }
    return { ok: true };
  }

  // El cliente edita sus propios datos (nombre, telefono y/o contrasena)
  async updateProfile(
    userId: string,
    dto: { nombre?: string; telefono?: string; password?: string },
  ) {
    const data: any = {};
    if (dto.nombre) data.nombre = dto.nombre;
    if (dto.telefono) data.telefono = dto.telefono;
    if (dto.password) {
      if (dto.password.length < 8)
        throw new NotFoundException('La contrasena debe tener al menos 8 caracteres');
      data.password = await bcrypt.hash(dto.password, 10);
    }
    await this.prisma.user.update({ where: { id: userId }, data });
    return { ok: true };
  }

  // ADMIN: busca clientes por nombre o cedula
  searchClients(q: string) {
    return this.prisma.user.findMany({
      where: {
        role: 'CLIENTE',
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { cedula: { contains: q } },
        ],
      },
      select: { id: true, nombre: true, cedula: true, telefono: true },
      take: 20,
    });
  }

  // ADMIN: resetea la contrasena de un cliente (recuperacion asistida)
  async resetPassword(targetUserId: string, nuevaPassword: string) {
    if (!nuevaPassword || nuevaPassword.length < 8)
      throw new NotFoundException('La contrasena debe tener al menos 8 caracteres');
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const hash = await bcrypt.hash(nuevaPassword, 10);
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { password: hash },
    });
    return { ok: true };
  }
}
