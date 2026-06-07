// Seed multi-tenant en JavaScript puro: "node prisma/seed.js".
// Idempotente: correrlo varias veces no duplica nada.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Helper: crea un producto solo si no existe ya por (negocio, nombre).
async function ensureProduct(businessId, prod) {
  const ya = await prisma.product.findFirst({
    where: { businessId, nombre: prod.nombre },
  });
  if (!ya) await prisma.product.create({ data: { ...prod, businessId } });
}

// Helper: crea una categoria del negocio (clave unica: businessId + nombre).
async function ensureCategory(businessId, nombre, orden) {
  return prisma.category.upsert({
    where: { businessId_nombre: { businessId, nombre } },
    update: {},
    create: { businessId, nombre, orden },
  });
}

async function main() {
  // ============================================================
  // SUPER-ADMIN (dueno de la plataforma, sin businessId)
  // ============================================================
  const superPass = await bcrypt.hash('Super1234', 10);
  await prisma.user.upsert({
    where: { cedula: '00100000000' },
    update: {},
    create: {
      cedula: '00100000000',
      password: superPass,
      nombre: 'Super Admin',
      telefono: '8090000001',
      role: 'SUPER_ADMIN',
    },
  });

  // ============================================================
  // NEGOCIO 1: Super Empanada El Meneo (paleta amarilla original)
  // ============================================================
  const empanada = await prisma.business.upsert({
    where: { slug: 'super-empanada' },
    update: {},
    create: {
      slug: 'super-empanada',
      nombre: 'Super Empanada El Meneo',
      colorPrimary: '#FFD400',
      colorBg: '#0B0B0F',
      colorCard: '#15151D',
      colorAccent: '#E53935',
      horaApertura: '09:00',
      horaCierre: '22:00',
    },
  });

  const adminEmpPass = await bcrypt.hash('Admin1234', 10);
  await prisma.user.upsert({
    where: { cedula: '00100000001' },
    update: { businessId: empanada.id, role: 'ADMIN' },
    create: {
      cedula: '00100000001',
      password: adminEmpPass,
      nombre: 'Admin Empanada',
      telefono: '8090000000',
      role: 'ADMIN',
      businessId: empanada.id,
    },
  });

  const empCats = {};
  empCats.empanadas = await ensureCategory(empanada.id, 'Empanadas', 1);
  await ensureCategory(empanada.id, 'Refrescos', 2);
  await ensureCategory(empanada.id, 'Batidas', 3);
  await ensureCategory(empanada.id, 'Salsas', 4);

  const empProds = [
    { nombre: 'Empanada de Pollo', descripcion: 'Pollo guisado criollo', imagen: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400', precio: 60, categoryId: empCats.empanadas.id },
    { nombre: 'Empanada de Queso', descripcion: 'Queso derretido', imagen: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', precio: 55, categoryId: empCats.empanadas.id },
    { nombre: 'Empanada de Carne', descripcion: 'Carne molida sazonada', imagen: 'https://images.unsplash.com/photo-1625938145312-c88c6e9eaf12?w=400', precio: 65, categoryId: empCats.empanadas.id },
    { nombre: 'Empanada Mixta', descripcion: 'Pollo, queso y vegetales', imagen: 'https://images.unsplash.com/photo-1568901839119-631418a3910d?w=400', precio: 70, categoryId: empCats.empanadas.id },
  ];
  for (const p of empProds) await ensureProduct(empanada.id, p);

  await prisma.delivery.createMany({
    data: [
      { nombre: 'Juan Repartidor', telefono: '8095551111', businessId: empanada.id },
      { nombre: 'Pedro Motor', telefono: '8295552222', businessId: empanada.id },
    ],
    skipDuplicates: true,
  });

  // ============================================================
  // NEGOCIO 2: Colmado La Esquina (segundo tenant de ejemplo)
  // Branding distinto para probar el aislamiento visual (Fase 2).
  // ============================================================
  const colmado = await prisma.business.upsert({
    where: { slug: 'colmado-la-esquina' },
    update: {},
    create: {
      slug: 'colmado-la-esquina',
      nombre: 'Colmado La Esquina',
      colorPrimary: '#2ECC71',
      colorBg: '#0A0F0B',
      colorCard: '#121A14',
      colorAccent: '#F1C40F',
      horaApertura: '07:00',
      horaCierre: '23:00',
    },
  });

  const adminColPass = await bcrypt.hash('Colmado1234', 10);
  await prisma.user.upsert({
    where: { cedula: '00100000002' },
    update: { businessId: colmado.id, role: 'ADMIN' },
    create: {
      cedula: '00100000002',
      password: adminColPass,
      nombre: 'Admin Colmado',
      telefono: '8090000002',
      role: 'ADMIN',
      businessId: colmado.id,
    },
  });

  const colCats = {};
  colCats.bebidas = await ensureCategory(colmado.id, 'Bebidas', 1);
  colCats.snacks = await ensureCategory(colmado.id, 'Snacks', 2);
  await ensureCategory(colmado.id, 'Limpieza', 3);

  const colProds = [
    { nombre: 'Refresco Cola 2L', descripcion: 'Botella familiar', imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400', precio: 90, categoryId: colCats.bebidas.id },
    { nombre: 'Agua 1L', descripcion: 'Botella de agua purificada', imagen: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400', precio: 35, categoryId: colCats.bebidas.id },
    { nombre: 'Platanitos', descripcion: 'Funda de platanitos fritos', imagen: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400', precio: 40, categoryId: colCats.snacks.id },
    { nombre: 'Galletas', descripcion: 'Paquete de galletas surtidas', imagen: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', precio: 50, categoryId: colCats.snacks.id },
  ];
  for (const p of colProds) await ensureProduct(colmado.id, p);

  await prisma.delivery.createMany({
    data: [
      { nombre: 'Luis Delivery', telefono: '8095553333', businessId: colmado.id },
    ],
    skipDuplicates: true,
  });

  console.log('Seed multi-tenant completado.');
  console.log('  Super-Admin: cedula 00100000000 / pass Super1234');
  console.log('  Admin Empanada: cedula 00100000001 / pass Admin1234');
  console.log('  Admin Colmado:  cedula 00100000002 / pass Colmado1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
