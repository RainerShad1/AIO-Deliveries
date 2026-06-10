import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// El socket vive en la RAIZ del backend (sin /api). Si no hay
// NEXT_PUBLIC_SOCKET_URL, la derivamos del API URL quitando el /api final.
function socketUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (explicit) return explicit;
  const api = process.env.NEXT_PUBLIC_API_URL || '';
  return api.replace(/\/api\/?$/, '');
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(socketUrl(), {
      autoConnect: false,
      // websocket primero; polling de respaldo (Railway soporta ambos)
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}
