import { prisma } from "@/lib/prisma";

export async function cargarDatosPresupuesto() {
  const [clientes, servicios, grupos] = await Promise.all([
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
      select: { id: true, nombre: true, servicios: { select: { nombre: true } } },
      orderBy: { nombre: "asc" },
    }),
  ]);
  return { clientes, servicios, grupos };
}
