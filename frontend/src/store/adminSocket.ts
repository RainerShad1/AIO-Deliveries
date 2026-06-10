'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/store/auth';
import type { Order } from '@/types';

/**
 * Hook que mantiene la lista de pedidos del admin sincronizada en tiempo real
 * y reproduce un sonido cuando entra un pedido nuevo.
 */
export function useAdminOrders(initial: Order[]) {
  const businessId = useAuth((s) => s.businessId);
  const [orders, setOrders] = useState<Order[]>(initial);
  const [soundOn, setSoundOn] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  useEffect(() => {
    setOrders(initial);
  }, [initial]);

  useEffect(() => {
    if (!businessId) return; // sin negocio (ej. super-admin) no hay sala
    audioRef.current = new Audio('/new-order.mp3');

    const socket = getSocket();
    if (!socket.connected) socket.connect();
    const room = `admin:${businessId}`; // sala POR NEGOCIO (Fase 1B)
    socket.emit('join', room);
    // Si el socket se reconecta (red movil, etc.), volver a unirse a la sala
    const rejoin = () => socket.emit('join', room);
    socket.on('connect', rejoin);

    const onNew = (order: Order) => {
      setOrders((prev) => [order, ...prev]);
      if (soundOnRef.current) {
        // play() puede fallar sin interaccion previa; lo capturamos
        audioRef.current?.play().catch(() => {});
      }
    };
    const onUpdate = (order: Order) => {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
    };

    socket.on('order:new', onNew);
    socket.on('order:update', onUpdate);
    return () => {
      socket.off('connect', rejoin);
      socket.off('order:new', onNew);
      socket.off('order:update', onUpdate);
    };
  }, [businessId]);

  const patchLocal = useCallback((order: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
  }, []);

  return { orders, soundOn, setSoundOn, patchLocal };
}
