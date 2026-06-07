import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessService } from '../business/business.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersGateway } from './orders.gateway';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private business: BusinessService,
    private gateway: OrdersGateway,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    // 1. Resolver el negocio por slug (404 si no existe o esta suspendido)
    const businessId = await this.business.resolveId(dto.business);

    // 2. Validar que ese negocio este abierto ahora
    if (!(await this.business.isOpen(businessId))) {
      throw new BadRequestException('El negocio esta cerrado en este momento');
    }

    // 3. Validar direccion del usuario (la direccion es del cliente, global)
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId, activa: true },
    });
    if (!address) throw new NotFoundException('Direccion invalida');

    // 4. Traer productos y validar que esten activos Y SEAN DE ESTE NEGOCIO.
    //    Esto hace cumplir la regla "un carrito = un solo negocio": si algun
    //    item es de otro negocio, no aparece y el conteo no cuadra -> rechaza.
    const ids = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, activo: true, businessId },
    });
    if (products.length !== ids.length) {
      throw new BadRequestException(
        'Algun producto no esta disponible o no pertenece a este negocio',
      );
    }

    // 5. Calcular total con snapshot de precios (en el servidor, nunca el cliente)
    const priceMap = new Map(products.map((p) => [p.id, p.precio]));
    let total = new Prisma.Decimal(0);
    const itemsData = dto.items.map((i) => {
      const precioUnit = priceMap.get(i.productId)!;
      total = total.add(precioUnit.mul(i.cantidad));
      return { productId: i.productId, cantidad: i.cantidad, precioUnit };
    });

    // 6. Crear en transaccion. El numero de pedido es POR NEGOCIO: se incrementa
    //    Business.orderSeq de forma atomica y se usa ese valor. Asi cada negocio
    //    tiene su propia secuencia PED-000001, PED-000002, sin colisiones ni
    //    condiciones de carrera entre pedidos simultaneos.
    const order = await this.prisma.$transaction(async (tx) => {
      const biz = await tx.business.update({
        where: { id: businessId },
        data: { orderSeq: { increment: 1 } },
        select: { orderSeq: true },
      });
      const numero = `PED-${String(biz.orderSeq).padStart(6, '0')}`;
      return tx.order.create({
        data: {
          numero,
          businessId,
          userId,
          addressId: dto.addressId,
          nota: dto.nota,
          total,
          items: { create: itemsData },
        },
        include: {
          items: { include: { product: true } },
          user: true,
          address: true,
        },
      });
    });

    // 7. Notificar SOLO al panel de ese negocio (sonido + dashboard)
    this.gateway.notifyNewOrder(order);
    return order;
  }

  // Cliente: ve sus pedidos de TODOS los negocios (el cliente es global).
  findMine(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: true } },
        delivery: true,
        business: { select: { nombre: true, slug: true, logo: true } },
      },
    });
  }

  // Admin: todos los pedidos DE SU negocio
  findAll(businessId: string) {
    return this.prisma.order.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: true } },
        user: true,
        address: true,
        delivery: true,
      },
    });
  }

  // Admin: pedidos de hoy DE SU negocio (dashboard/reportes)
  findToday(businessId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.prisma.order.findMany({
      where: { businessId, createdAt: { gte: start } },
      include: { items: true, user: true },
    });
  }

  // Admin: cambiar estado. findFirst con businessId impide tocar pedidos ajenos.
  async updateStatus(businessId: string, id: string, status: OrderStatus) {
    const exists = await this.prisma.order.findFirst({
      where: { id, businessId },
    });
    if (!exists) throw new NotFoundException('Pedido no encontrado');

    const order = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: { include: { product: true } },
        user: true,
        address: true,
        delivery: true,
      },
    });
    this.gateway.notifyStatusChange(order);
    return order;
  }

  // Admin: asignar delivery. El pedido Y el delivery deben ser del negocio.
  async assignDelivery(businessId: string, id: string, deliveryId: string) {
    const order0 = await this.prisma.order.findFirst({
      where: { id, businessId },
    });
    if (!order0) throw new NotFoundException('Pedido no encontrado');

    const delivery = await this.prisma.delivery.findFirst({
      where: { id: deliveryId, businessId },
    });
    if (!delivery) throw new NotFoundException('Delivery no encontrado');

    const order = await this.prisma.order.update({
      where: { id },
      data: { deliveryId, status: OrderStatus.EN_CAMINO },
      include: {
        items: { include: { product: true } },
        user: true,
        address: true,
        delivery: true,
      },
    });
    this.gateway.notifyStatusChange(order);
    return order;
  }

  // Detalle: el cliente solo ve los suyos; el admin solo los de su negocio;
  // el super-admin puede ver cualquiera.
  async getOne(
    id: string,
    userId: string,
    role: string,
    businessId: string | null,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: true,
        address: true,
        delivery: true,
      },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    if (role === 'SUPER_ADMIN') return order;
    if (role === 'ADMIN') {
      if (order.businessId !== businessId) throw new ForbiddenException();
      return order;
    }
    // CLIENTE
    if (order.userId !== userId) throw new ForbiddenException();
    return order;
  }
}
