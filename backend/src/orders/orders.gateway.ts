import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL } })
export class OrdersGateway {
  @WebSocketServer() server: Server;

  // Salas:
  //   user:<userId>        -> un cliente concreto (sus pedidos)
  //   admin:<businessId>   -> panel del admin de UN negocio
  // Cada admin solo se une a admin:<su businessId>, asi el sonido de pedido
  // nuevo y los refrescos del dashboard quedan aislados por negocio.
  @SubscribeMessage('join')
  handleJoin(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.join(room);
  }

  // Pedido nuevo -> solo al panel del negocio correspondiente
  notifyNewOrder(order: any) {
    this.server.to(`admin:${order.businessId}`).emit('order:new', order);
  }

  // Cambio de estado -> al cliente dueno y al panel del negocio
  notifyStatusChange(order: any) {
    this.server.to(`user:${order.userId}`).emit('order:status', order);
    this.server.to(`admin:${order.businessId}`).emit('order:update', order);
  }
}
