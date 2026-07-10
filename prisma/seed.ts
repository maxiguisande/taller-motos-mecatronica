import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Usuario admin (idempotente) ──────────────────────────
  const email = "admin@taller.com";
  const passwordHash = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, nombre: "Administrador", passwordHash, rol: "admin" },
  });
  console.log(`✔ Admin: ${email} / admin1234`);

  // ── Empleados de ejemplo ─────────────────────────────────
  const passEmpleado = await bcrypt.hash("empleado123", 10);
  const pedro = await prisma.user.upsert({
    where: { email: "pedro@taller.com" },
    update: {},
    create: { email: "pedro@taller.com", nombre: "Pedro Gómez", passwordHash: passEmpleado, rol: "empleado" },
  });
  const ana = await prisma.user.upsert({
    where: { email: "ana@taller.com" },
    update: {},
    create: { email: "ana@taller.com", nombre: "Ana Ruiz", passwordHash: passEmpleado, rol: "empleado" },
  });
  console.log("✔ Empleados: pedro@taller.com, ana@taller.com / empleado123");

  // Limpia los datos de demo previos (respeta las FKs). No toca usuarios.
  await prisma.turno.deleteMany();
  await prisma.ordenItem.deleteMany();
  await prisma.ordenTrabajo.deleteMany();
  await prisma.contacto.deleteMany();
  await prisma.moto.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.servicio.deleteMany();
  await prisma.grupoServicio.deleteMany();
  await prisma.cliente.deleteMany();
  console.log("• Datos de demo previos eliminados.");

  // ── Servicios (mano de obra) ─────────────────────────────
  const defs: Record<string, { duracionMin?: number }> = {
    "Cambio de aceite": { duracionMin: 30 },
    "Cambio de filtro de aceite": { duracionMin: 20 },
    "Cambio de filtro de aire": { duracionMin: 20 },
    "Cambio de bujía": { duracionMin: 15 },
    "Ajuste de cadena": { duracionMin: 20 },
    "Cambio de pastillas de freno": { duracionMin: 45 },
    "Revisión general": { duracionMin: 40 },
    "Lavado": { duracionMin: 30 },
  };
  const servicios: Record<string, string> = {};
  for (const [nombre, d] of Object.entries(defs)) {
    const s = await prisma.servicio.create({
      data: { nombre, duracionMin: d.duracionMin },
    });
    servicios[nombre] = s.id;
  }
  console.log(`✔ ${Object.keys(servicios).length} servicios`);

  // ── Repuestos / insumos (con stock) ──────────────────────
  const prodDefs: Record<string, { precio: number; costo: number; stock: number; min: number }> = {
    "Aceite 10W40 (litro)": { precio: 9000, costo: 5500, stock: 24, min: 6 },
    "Filtro de aceite": { precio: 6000, costo: 3200, stock: 15, min: 4 },
    "Filtro de aire": { precio: 5500, costo: 2800, stock: 10, min: 3 },
    "Bujía NGK": { precio: 4500, costo: 2100, stock: 20, min: 5 },
    "Kit de cadena y coronas": { precio: 45000, costo: 30000, stock: 3, min: 2 },
    "Pastillas de freno (juego)": { precio: 14000, costo: 8000, stock: 8, min: 3 },
    "Cubierta trasera": { precio: 55000, costo: 38000, stock: 2, min: 2 },
  };
  const productos: Record<string, string> = {};
  for (const [nombre, d] of Object.entries(prodDefs)) {
    const p = await prisma.producto.create({
      data: { nombre, precio: d.precio, costo: d.costo, stock: d.stock, stockMinimo: d.min },
    });
    productos[nombre] = p.id;
  }
  console.log(`✔ ${Object.keys(productos).length} repuestos`);

  // ── Grupos de servicios ──────────────────────────────────
  await prisma.grupoServicio.create({
    data: {
      nombre: "Service básico",
      descripcion: "Aceite, filtro de aceite y ajuste de cadena.",
      color: "#57a12e",
      servicios: {
        connect: [
          { id: servicios["Cambio de aceite"] },
          { id: servicios["Cambio de filtro de aceite"] },
          { id: servicios["Ajuste de cadena"] },
        ],
      },
    },
  });
  await prisma.grupoServicio.create({
    data: {
      nombre: "Service completo",
      descripcion: "Aceite, filtros, bujía, cadena y revisión general.",
      color: "#2563eb",
      servicios: {
        connect: [
          { id: servicios["Cambio de aceite"] },
          { id: servicios["Cambio de filtro de aceite"] },
          { id: servicios["Cambio de filtro de aire"] },
          { id: servicios["Cambio de bujía"] },
          { id: servicios["Ajuste de cadena"] },
          { id: servicios["Revisión general"] },
        ],
      },
    },
  });
  await prisma.grupoServicio.create({
    data: {
      nombre: "Frenos",
      descripcion: "Cambio de pastillas de freno.",
      color: "#dc2626",
      servicios: { connect: [{ id: servicios["Cambio de pastillas de freno"] }] },
    },
  });
  console.log("✔ 3 grupos de servicios");

  const hoy = new Date();
  const enUnMes = new Date(hoy);
  enUnMes.setMonth(enUnMes.getMonth() + 1);
  const haceUnMes = new Date(hoy);
  haceUnMes.setMonth(haceUnMes.getMonth() - 1);
  const enTresDias = new Date(hoy);
  enTresDias.setDate(enTresDias.getDate() + 3);

  // ── Clientes con contactos y motos ───────────────────────
  const juan = await prisma.cliente.create({
    data: {
      nombre: "Juan",
      apellido: "Pérez",
      contactos: {
        create: [
          { tipo: "celular", valor: "11 5555-1234", etiqueta: "personal", principal: true },
          { tipo: "whatsapp", valor: "11 5555-1234" },
        ],
      },
      motos: {
        create: [
          {
            marca: "Honda", modelo: "CG 150", anio: 2019, cilindrada: 150,
            patente: "AB123CD", color: "Negro", kmActual: 24500,
            proximoServiceKm: 27000, proximoServiceFecha: enUnMes,
          },
        ],
      },
    },
    include: { motos: true },
  });

  const maria = await prisma.cliente.create({
    data: {
      nombre: "María",
      apellido: "Gómez",
      contactos: {
        create: [{ tipo: "celular", valor: "11 4444-5678", principal: true }],
      },
      motos: {
        create: [
          {
            marca: "Yamaha", modelo: "YBR 125", anio: 2021, cilindrada: 125,
            patente: "AC456EF", color: "Azul", kmActual: 12000,
            proximoServiceKm: 15000, proximoServiceFecha: enTresDias,
          },
        ],
      },
    },
    include: { motos: true },
  });

  await prisma.cliente.create({
    data: {
      nombre: "Carlos",
      apellido: "López",
      contactos: {
        create: [
          { tipo: "celular", valor: "11 3333-9012", principal: true },
          { tipo: "email", valor: "carlos.lopez@mail.com" },
        ],
      },
      motos: {
        create: [
          {
            marca: "Bajaj", modelo: "Rouser 200", anio: 2022, cilindrada: 200,
            patente: "AD789GH", color: "Rojo", kmActual: 8000,
          },
        ],
      },
    },
  });
  console.log("✔ 3 clientes con contactos y motos");

  // ── Órdenes de ejemplo ───────────────────────────────────
  const finJuan = new Date(haceUnMes.getTime() + 110 * 60000); // +1h50
  await prisma.ordenTrabajo.create({
    data: {
      clienteId: juan.id,
      motoId: juan.motos[0].id,
      mecanicoId: pedro.id,
      fecha: haceUnMes,
      estado: "completado",
      estadoPago: "pagado",
      medioPago: "efectivo",
      kilometraje: 24500,
      iniciadoEn: haceUnMes,
      finalizadoEn: finJuan,
      totalArs: 39000,
      items: {
        create: [
          { tipo: "servicio", servicioId: servicios["Cambio de aceite"], descripcion: "Cambio de aceite", precio: 15000, cantidad: 1, realizado: true },
          { tipo: "repuesto", productoId: productos["Aceite 10W40 (litro)"], descripcion: "Aceite 10W40 (litro)", precio: 9000, cantidad: 1, realizado: true },
          { tipo: "repuesto", productoId: productos["Filtro de aceite"], descripcion: "Filtro de aceite", precio: 6000, cantidad: 1, realizado: true },
          { tipo: "servicio", servicioId: servicios["Ajuste de cadena"], descripcion: "Ajuste de cadena", precio: 5000, cantidad: 1, realizado: true },
          { tipo: "servicio", servicioId: servicios["Cambio de filtro de aceite"], descripcion: "Cambio de filtro de aceite", precio: 8000, cantidad: 1, realizado: true },
        ],
      },
    },
  });

  // Orden en curso, asignada a Ana (para ver el flujo del empleado).
  await prisma.ordenTrabajo.create({
    data: {
      clienteId: maria.id,
      motoId: maria.motos[0].id,
      mecanicoId: ana.id,
      fecha: hoy,
      estado: "en_proceso",
      estadoPago: "pendiente",
      kilometraje: 12000,
      iniciadoEn: new Date(hoy.getTime() - 25 * 60000), // empezó hace 25 min
      totalArs: 34000,
      items: {
        create: [
          { tipo: "servicio", servicioId: servicios["Cambio de pastillas de freno"], descripcion: "Cambio de pastillas de freno", precio: 20000, cantidad: 1, realizado: true },
          { tipo: "repuesto", productoId: productos["Pastillas de freno (juego)"], descripcion: "Pastillas de freno (juego)", precio: 14000, cantidad: 1, realizado: false },
        ],
      },
    },
  });
  console.log("✔ 2 órdenes de trabajo (1 finalizada, 1 en curso)");

  // ── Turno de ejemplo ─────────────────────────────────────
  await prisma.turno.create({
    data: {
      clienteId: juan.id,
      motoId: juan.motos[0].id,
      fecha: enTresDias,
      motivo: "Service de 27.000 km",
      estado: "confirmado",
    },
  });
  console.log("✔ 1 turno");

  console.log("\n🌱 Seed completo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
