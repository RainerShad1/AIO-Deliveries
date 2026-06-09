export type Role = 'CLIENTE' | 'ADMIN' | 'SUPER_ADMIN';
export type OrderStatus = 'ENVIADO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';

export interface Business {
  id: string;
  slug: string;
  nombre: string;
  logo?: string | null;
  bannerUrl?: string | null;
  colorPrimary: string;
  colorBg: string;
  colorCard: string;
  colorAccent: string;
  horaApertura: string;
  horaCierre: string;
  abierto: boolean;
}

export interface Category {
  id: string;
  nombre: string;
  orden: number;
  activa?: boolean;
}

export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  precio: string; // Decimal llega como string
  activo: boolean;
  categoryId?: string | null;
  category?: Category | null;
}

export interface Address {
  id: string;
  etiqueta: string;
  direccion: string;
  lat?: number;
  lng?: number;
}

export interface OrderItem {
  id: string;
  cantidad: number;
  precioUnit: string;
  product: Product;
}

export interface UserLite {
  id: string;
  nombre: string;
  telefono: string;
}

export interface Order {
  id: string;
  numero: string;
  status: OrderStatus;
  nota?: string;
  total: string;
  items: OrderItem[];
  address?: Address;
  user?: UserLite;
  delivery?: { id: string; nombre: string; telefono: string };
  createdAt: string;
  userId: string;
  businessId?: string;
  business?: { nombre: string; slug: string; logo?: string | null };
}
