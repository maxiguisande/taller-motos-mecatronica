import { prisma } from "@/lib/prisma";

/**
 * Marca como "vencido" los presupuestos cuya fecha de validez ya pasó y que
 * siguen pendientes de decisión (borrador o enviado). No toca los aprobados,
 * rechazados ni los ya vencidos. Idempotente: se puede llamar en cada lectura.
 * Devuelve cuántos se vencieron.
 */
export async function vencerPresupuestosVencidos(): Promise<number> {
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const { count } = await prisma.presupuesto.updateMany({
    where: {
      estado: { in: ["borrador", "enviado"] },
      validezHasta: { lt: inicioHoy },
    },
    data: { estado: "vencido" },
  });
  return count;
}

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
