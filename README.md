# 🛍️ AIO Deliverys — Plataforma multi-negocio de pedidos a domicilio

Plataforma web tipo PedidosYa/Uber Eats donde varios negocios (restaurantes, colmados, farmacias) tienen su propia tienda con logo, colores y productos, y el cliente final navega entre todos ellos. Mobile-first, multi-tenant y construida por fases.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router) + React 18 + TailwindCSS |
| Backend | Node.js + NestJS 10 |
| Base de datos | PostgreSQL |
| ORM | Prisma 5 |
| Tiempo real | Socket.IO |
| Autenticación | JWT + roles (CLIENTE / ADMIN / SUPER_ADMIN) |
| Mapas | Google Maps JS API (ubicación con pin) |
| Estado (frontend) | Zustand |

## Estructura del proyecto

```
deliveries/
├── backend/          # API NestJS + Prisma + Socket.IO
│   ├── prisma/       # schema.prisma + seed.ts
│   └── src/
│       ├── auth/         # registro, login, JWT, validación cédula RD
│       ├── users/        # perfil + direcciones múltiples
│       ├── products/     # CRUD productos / precios / activo
│       ├── orders/       # pedidos, estados, asignación, gateway socket
│       ├── deliveries/   # repartidores
│       ├── config/       # horarios del negocio
│       └── common/       # guards, decorators, validador cédula, filtro errores
├── frontend/         # Next.js
│   └── src/
│       ├── app/          # rutas: landing, auth, menu, orders, admin
│       ├── components/   # UI compartida + admin
│       ├── store/        # zustand (auth, cart, adminSocket)
│       └── lib/          # api, socket, whatsapp
├── docker-compose.yml
└── README.md
```

## Requisitos

- Node.js 20+
- PostgreSQL 14+ (o Docker)
- Una API key de Google Maps (opcional para el pin visual)

---

## Puesta en marcha (desarrollo)

### Opción A — Manual

**1. Backend**

```bash
cd backend
cp .env.example .env          # edita DATABASE_URL y JWT_SECRET
npm install
npx prisma migrate dev --name init
npx prisma db seed            # crea admin + productos de ejemplo
npm run start:dev             # http://localhost:4000/api
```

**2. Frontend**

```bash
cd frontend
cp .env.local.example .env.local   # edita las URLs y la key de Maps
npm install
npm run dev                        # http://localhost:3000
```

### Opción B — Docker (todo de una vez)

```bash
docker compose up --build
```

Esto levanta PostgreSQL, backend y frontend. Tras el primer arranque, ejecuta el seed:

```bash
docker compose exec backend npx prisma db seed
```

---

## Credenciales de prueba (tras el seed)

- **Admin:** cédula `00100000001` / contraseña `Admin1234`
- El panel admin está en `/admin`. Cámbialas en producción.

---

## Flujo de uso

1. El cliente entra y la app pide su ubicación (GPS o dirección manual).
2. Se registra (cédula dominicana validada) e inicia sesión.
3. Ve el menú, agrega empanadas al carrito, añade una nota y confirma.
4. El pedido llega **en vivo** al panel admin con sonido.
5. El admin asigna un delivery y pulsa **Enviar por WhatsApp** → se abre `wa.me` con todos los datos.
6. El admin cambia el estado (en camino → entregado); el cliente lo ve **en tiempo real**.

---

## Notas técnicas importantes

- **Precios:** el total se calcula siempre en el servidor con un snapshot del precio en cada `OrderItem`. El cliente nunca define el monto.
- **Número de pedido:** formato `PED-000001`, generado dentro de una transacción.
- **Cédula dominicana:** validada con el algoritmo de dígito verificador de la JCE.
- **Horarios:** si el negocio está cerrado, el backend rechaza nuevos pedidos y el frontend muestra el aviso.
- **bcryptjs:** se usa la versión JS pura (no `bcrypt` nativo) para evitar problemas de compilación en hosts sin toolchain.
- **Sonido admin:** coloca un archivo real `frontend/public/new-order.mp3`. Los navegadores requieren una interacción (el botón de sonido) antes de poder reproducir audio.

---

## Recomendaciones de hosting

| Componente | Opciones recomendadas |
|-----------|----------------------|
| Frontend (Next.js) | **Vercel** (ideal), Netlify |
| Backend (NestJS) | **Railway**, Render, Fly.io, VPS con Docker |
| Base de datos | **Neon**, Supabase, Railway Postgres, RDS |

Pasos clave en producción:

1. Define `JWT_SECRET` largo y aleatorio.
2. Ajusta `FRONTEND_URL` (CORS) y las `NEXT_PUBLIC_*` a los dominios reales.
3. Usa `npx prisma migrate deploy` (ya incluido en el Dockerfile del backend).
4. Restringe la API key de Google Maps por dominio.
5. Sirve todo bajo HTTPS (la geolocalización del navegador lo exige).

---

## Fases construidas

- **Fase 1** — Arquitectura, NestJS, Prisma, JWT, roles, validación de cédula, rate limiting.
- **Fase 2** — Frontend cliente: ubicación, auth, menú, carrito, seguimiento en tiempo real.
- **Fase 3** — Panel admin: dashboard, pedidos en vivo con sonido, productos, reportes, ganancias.
- **Fase 4** — Integración WhatsApp (`wa.me`) con datos completos del pedido.
- **Fase 5** — Manejo global de errores, loading states, SEO, Docker, deploy.

## Pendiente / mejoras sugeridas

- Pin visual de Google Maps con `@react-google-maps/api` (la captura GPS ya funciona).
- Refresh tokens y expiración corta del access token.
- Tabla `SEQUENCE` de Postgres para el número de pedido bajo alta concurrencia.
- Subida de imágenes de productos (hoy se usa URL).
