import { prisma } from "@/lib/prisma";

/** Carga los datos necesarios para el formulario de orden (alta/edición). */
export async function cargarDatosForm() {
  const [clientes, servicios, grupos, productos, mecanicos] = await Promise.all([
    prisma.cliente.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        motos: {
          select: { id: true, marca: true, modelo: true, patente: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    }),
    prisma.servicio.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.grupoServicio.findMany({
      select: {
        id: true,
        nombre: true,
        servicios: { select: { id: true, nombre: true } },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.producto.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, precio: true, stock: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.user.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return {
    clientes,
    servicios,
    grupos,
    productos: productos.map((p) => ({ ...p, precio: Number(p.precio) })),
    mecanicos,
  };
}
