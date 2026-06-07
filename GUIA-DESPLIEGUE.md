# Guia de despliegue — AIO Deliverys

Stack de hosting gratuito recomendado:
- **Base de datos:** Neon (PostgreSQL serverless, plan free)
- **Backend (NestJS):** Railway (plan free con creditos) o Render
- **Frontend (Next.js):** Vercel (plan free, ideal para Next.js)

Todos incluyen HTTPS automatico. No necesitas dominio para empezar
(te dan URLs tipo `*.vercel.app`, `*.up.railway.app`, `*.neon.tech`).

---

## ORDEN DE DESPLIEGUE

Hazlo en este orden porque cada parte necesita la URL de la anterior:
**1) Base de datos → 2) Backend → 3) Frontend**

---

## PASO 1 — Base de datos (Neon)

1. Crea cuenta en https://neon.tech
2. Crea un proyecto nuevo (region: la mas cercana, ej. US East).
3. Copia el **connection string** que te dan. Se ve asi:
   ```
   postgresql://usuario:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Guardalo. Es tu `DATABASE_URL` para el backend.

Nota: Neon ya trae SSL. El `?sslmode=require` es importante, no lo quites.

---

## PASO 2 — Backend (Railway)

El backend es una app NestJS con Docker. Railway puede construir desde tu repo.

### 2.1 Sube el codigo a GitHub
- Crea un repo en GitHub y sube el proyecto completo (sin node_modules).
- Asegurate de que el `.gitignore` excluya `node_modules`, `dist`, `.env`.

### 2.2 Crea el servicio en Railway
1. Crea cuenta en https://railway.app
2. New Project → Deploy from GitHub repo → elige tu repo.
3. Railway detecta varios servicios. Configura **solo el backend**:
   - Root directory: `/backend`
   - Railway usara el `Dockerfile` que ya existe ahi.

### 2.3 Variables de entorno del backend
En Settings → Variables, agrega:
```
DATABASE_URL = (el connection string de Neon del Paso 1)
JWT_SECRET   = (genera uno seguro, ver abajo)
PORT         = 4000
FRONTEND_URL = (la URL de Vercel; la tendras tras el Paso 3, puedes
                ponerla provisional y actualizarla despues)
```

**Generar un JWT_SECRET seguro** (en tu terminal local):
```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Copia ese valor largo y ponlo como JWT_SECRET. NUNCA uses el de ejemplo.

### 2.4 Ajuste del comando de arranque
El Dockerfile actual corre `prisma db push` al iniciar, lo cual crea las
tablas en Neon automaticamente la primera vez. Perfecto, no toques nada.

### 2.5 Tras el deploy
- Railway te da una URL publica, ej: `https://aio-deliverys-backend-production.up.railway.app`
- Tu API quedara en esa URL + `/api`
- Guarda esa URL para el Paso 3.

### 2.6 Cargar el admin y productos (seed)
Una vez desplegado, abre la consola de Railway (o conecta por su CLI) y corre:
```
npx prisma db seed
```
Esto crea el admin inicial y los productos de ejemplo.
**IMPORTANTE:** cambia la contrasena del admin despues (ver seguridad abajo).

---

## PASO 3 — Frontend (Vercel)

1. Crea cuenta en https://vercel.com
2. Add New → Project → importa el mismo repo de GitHub.
3. Configura:
   - Root Directory: `frontend`
   - Framework Preset: Next.js (lo detecta solo)
4. **Variables de entorno** (Settings → Environment Variables).
   Estas son CRITICAS: deben apuntar al backend de Railway.
   ```
   NEXT_PUBLIC_API_URL    = https://TU-BACKEND.up.railway.app/api
   NEXT_PUBLIC_SOCKET_URL  = https://TU-BACKEND.up.railway.app
   NEXT_PUBLIC_GOOGLE_MAPS_KEY = (opcional, deja vacio o pon dummy)
   ```
   Recuerda: las NEXT_PUBLIC_* se incrustan en build, asi que ponlas ANTES
   de desplegar. Si las cambias luego, hay que volver a desplegar (redeploy).
5. Deploy. Vercel te da la URL: `https://tu-proyecto.vercel.app`

### 3.1 Cierra el circulo
Vuelve a Railway (backend) y actualiza:
```
FRONTEND_URL = https://tu-proyecto.vercel.app
```
Esto es necesario para CORS y para que Socket.IO acepte la conexion.
Railway redespliega solo al cambiar la variable.

---

## PASO 4 — Seguridad antes de abrir al publico

1. **Cambia la contrasena del admin.** El seed crea `00100000001 / Admin1234`.
   Entra como admin y, idealmente, crea un nuevo admin con contrasena fuerte
   (o cambia la del seed directo en la base de datos de Neon).
2. **JWT_SECRET:** confirma que NO es el valor de ejemplo.
3. **DATABASE_URL:** la de Neon ya es privada y con SSL. Bien.
4. **No subas `.env` a GitHub.** Verifica que esta en `.gitignore`.

---

## PASO 5 — Verificacion post-lanzamiento

Prueba este flujo completo desde tu telefono (con datos moviles, no wifi,
para simular un cliente real):
1. Entra a la URL de Vercel.
2. Acepta ubicacion (debe funcionar: ya hay HTTPS).
3. Registrate como cliente con una cedula valida.
4. Agrega productos, haz un pedido.
5. En otra pestana/dispositivo, entra como admin y verifica que el pedido
   llega en vivo con sonido.
6. Cambia el estado y confirma que el cliente lo ve en tiempo real.
7. Prueba el boton de WhatsApp al delivery.

---

## RESPALDOS (importante para no perder datos)

Neon hace backups automaticos en su plan, pero revisa la retencion del plan
free. Para algo critico, exporta periodicamente con:
```
pg_dump "TU_DATABASE_URL" > backup_$(date +%Y%m%d).sql
```

---

## COSTOS (resumen)

- Neon free: suficiente para empezar (limite de almacenamiento/computo generoso).
- Railway free: da creditos mensuales; un backend pequeno cabe. Si se agota,
  el plan Hobby es ~$5/mes.
- Vercel free: mas que suficiente para el frontend.
- Dominio (opcional): ~$10-12/ano cuando lo quieras.

Total para arrancar: **$0**. Cuando crezca, ~$5-15/mes.

---

## LIMITACIONES CONOCIDAS (para tener presente, no bloquean lanzar)

- No hay recuperacion de contrasena (si un cliente la olvida, no puede
  resetearla solo). Se puede agregar despues.
- Estimados de llegada son rangos fijos (15-30 / 10-15 min), no calculados
  por distancia real.
- Sin politica de privacidad / terminos. Recomendable agregar, sobre todo
  porque pides cedula y ubicacion.
- La sesion vive en localStorage del navegador (normal).

---

Cuando todo esto este verde, estas oficialmente lanzado. Suerte con
AIO Deliverys!
