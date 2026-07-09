import { prisma } from "@/lib/prisma";

export function cargarClientesConMotos() {
  return prisma.cliente.findMany({
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
  });
}
