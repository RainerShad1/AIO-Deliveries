# Documento de traspaso — Proyecto App Central de Pedidos (Multi-Tenant)

> Sube este archivo + el zip del proyecto al chat nuevo. Con esto, el asistente
> entiende todo el contexto sin reexplicar nada.

---

## QUE ES ESTE PROYECTO

Es una COPIA del sistema de pedidos "Super Empanada El Meneo" que se va a
transformar en una plataforma SaaS multi-negocio (multi-tenant): una sola app
donde varios negocios (restaurantes, colmados, farmacias) tienen su propia
tienda con su logo, colores y productos, y el cliente final navega entre todos
ellos (modelo tipo PedidosYa).

IMPORTANTE: este es un ENTORNO SEPARADO del negocio real de empanadas, que ya
está casi listo para el público y NO se debe tocar. Esta copia es para
desarrollar el multi-tenant sin comprometer el real.

---

## STACK TECNOLOGICO (ya montado y funcionando)

- Frontend: Next.js 14 (App Router) + React 18 + TailwindCSS + Zustand
- Backend: NestJS 10 + Prisma 5
- Base de datos: PostgreSQL
- Tiempo real: Socket.IO
- Auth: JWT con roles (CLIENTE / ADMIN)
- Deploy: Vercel (frontend) + Railway (backend) + Neon (base de datos)
- Iconos: lucide-react. Pagos/mapas: no integrados aun.

Colores de marca actuales (paleta amarilla):
- Primary amarillo #FFD400, fondo #0B0B0F, tarjetas #15151D, acento rojo #E53935

---

## QUE YA ESTA CONSTRUIDO (funcional)

Lado cliente:
- Landing con captura de ubicacion (GPS o manual) + logo y bienvenida
- Registro/login con cedula dominicana (validada), confirmar contrasena,
  mostrar/ocultar contrasena, formato automatico de cedula
- Redireccion inteligente: si ya hay sesion, va directo al menu (admin -> /admin)
- Menu rediseñado estilo Uber Eats: header con saludo "Hola [nombre]",
  estado abierto/cerrado, 25-40 min, busqueda, chips de categorias,
  grid de 3 columnas, carrito flotante tipo pildora
- Carrito con aviso si ya hay un pedido activo
- Animacion de "Pedido confirmado" con sonido
- Seguimiento de pedido en tiempo real con estimado de llegada
  (enviado: 15-30 min, en camino: 10-15 min)
- Mis pedidos: separa activos de anteriores, boton "Repetir pedido"
- Perfil: gestion de direcciones (agregar/eliminar, soft delete), editar datos
- Categorias con pestañas (Empanadas, Refrescos, Batidas, Salsas)

Lado admin:
- Dashboard con metricas y ganancias del dia
- Pedidos en vivo (Socket.IO) con sonido de pedido nuevo
- Detalle de pedido: cambiar estado, asignar delivery, WhatsApp, imprimir ticket
- Gestion de productos (crear/editar/borrar con soft delete) + asignar categoria
- Gestion de categorias (crear/borrar)
- Gestion de deliverys (crear/borrar con soft delete)
- Gestion de clientes: buscar y resetear contraseña (recuperacion asistida)
- Reportes

Otros:
- Logo real integrado (public/logo.jpg)
- Seed idempotente (no duplica productos al correr varias veces)
- Numero de pedido automatico PED-000001
- Total calculado en servidor (seguridad)

---

## DECISIONES YA TOMADAS PARA EL MULTI-TENANT

1. Modelo: UNA sola app donde el cliente ve TODOS los negocios (tipo PedidosYa).
2. Delivery: cada negocio entrega lo suyo (NO flota central). La flota central
   queda como vision futura.
3. Branding por negocio: cada negocio tiene su logo, colores, nombre. Se guardan
   en la entidad Business y se aplican dinamicamente.
4. Negocios beta para desarrollo:
   - Super Empanada El Meneo (migrar como primer tenant)
   - Un COLMADO ficticio (bebidas, snacks) como segundo ejemplo
5. Repo: NUEVO y separado (no rama), para no tocar el negocio real.
6. Roles: se agrega SUPER-ADMIN (dueño de la plataforma) por encima de los
   admins de cada negocio.

---

## PLAN POR FASES (del documento de arquitectura)

- Fase 0: Validacion comercial (en paralelo, no bloquea el desarrollo).
  Estado: se trabajara con negocios beta mientras se consigue cliente real.
- Fase 1: Fundacion multi-tenant (backend): entidad Business + businessId en
  todas las tablas + aislamiento de datos. <- EMPEZAR AQUI
- Fase 2: Branding dinamico + pantalla de seleccion de negocios (frontend).
- Fase 3: Panel de Super-Admin (alta de negocios, branding, suscripciones).
- Fase 4: Suscripciones y cobro.
- Fase 5: Mejoras por negocio (combos, banner, reseñas).

CRITICO: el aislamiento de datos (que un negocio nunca vea datos de otro) es lo
mas delicado. Toda consulta debe filtrar por businessId.

---

## ESTRUCTURA DEL PROYECTO

empanadas-app/
  backend/   (NestJS: auth, users, products, categories, orders, deliveries,
              config, common, prisma)
  frontend/  (Next.js: app/, components/, store/, lib/, types/)
  docker-compose.yml
  README.md

---

## COMO TRABAJAR ESTE PROYECTO (instrucciones para el asistente del chat nuevo)

- Este es un entorno de desarrollo separado. Construir el multi-tenant por fases.
- Empezar por la Fase 1 (fundacion backend), validando el build en cada paso.
- Al modificar el schema de Prisma, recordar que en produccion el arranque corre
  "prisma db push" automaticamente.
- Mantener el aislamiento de datos por businessId como prioridad absoluta.
- Entregar el proyecto como zip y guiar el despliegue (Vercel/Railway/Neon nuevos).
- El usuario tiene experiencia desplegando (ya lanzo el negocio real).
- El usuario prefiere avanzar por capas y que se le adviertan los riesgos con honestidad.
