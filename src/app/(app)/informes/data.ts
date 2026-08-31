import { prisma } from "@/lib/prisma";

// Mismo select que usan los turnos: clientes con sus motos.
export { cargarClientesConMotos } from "../turnos/data";

/** Servicios activos para armar ítems del informe desde el catálogo. */
export function cargarServiciosActivos() {
  return prisma.servicio.findMany({
    where: { activo: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}
