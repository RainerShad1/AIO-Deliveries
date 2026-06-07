# Archivos de la carpeta public

Coloca aqui los archivos estaticos del sitio:

- **new-order.mp3** — sonido que suena en el panel admin cuando entra un pedido nuevo.
- **logo.png** — logo del negocio (opcional). Para usarlo:
  1. Guarda tu logo como `logo.png` en esta carpeta (idealmente cuadrado, ej. 200x200px).
  2. Abre `src/components/Logo.tsx` y descomenta la version con `<img src="/logo.png" .../>`,
     comentando o borrando el bloque del placeholder.
  3. El logo aparecera automaticamente en login, registro, menu del cliente y panel admin.

Mientras no haya logo.png, se muestra un placeholder (cuadro naranja con 🥟).
