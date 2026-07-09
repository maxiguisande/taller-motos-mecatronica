"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";

/** Verifica que el usuario sea admin o el mecánico asignado a la orden. */
async function puedeTrabajar(ordenId: string) {
  const user = await currentUser();
  if (!user) return null;
  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id: ordenId },
    select: { id: true, mecanicoId: true, iniciadoEn: true },
  });
  if (!orden) return null;
  if (user.rol === "admin" || orden.mecanicoId === user.id) return orden;
  return null;
}

function refrescar(ordenId: string) {
  revalidatePath(`/ordenes/${ordenId}`);
  revalidatePath("/mis-tareas");
  revalidatePath("/ordenes");
}

export async function iniciarOrden(id: string) {
  const orden = await puedeTrabajar(id);
  if (!orden) return;
  await prisma.ordenTrabajo.update({
    where: { id },
    data: {
      estado: "en_proceso",
      iniciadoEn: orden.iniciadoEn ?? new Date(),
      finalizadoEn: null,
    },
  });
  refrescar(id);
}

export async function toggleTarea(itemId: string, ordenId: string) {
  if (!(await puedeTrabajar(ordenId))) return;
  const item = await prisma.ordenItem.findUnique({ where: { id: itemId } });
  if (!item || item.ordenId !== ordenId) return;
  await prisma.ordenItem.update({
    where: { id: itemId },
    data: { realizado: !item.realizado },
  });
  refrescar(ordenId);
}

export async function finalizarOrden(id: string) {
  const orden = await puedeTrabajar(id);
  if (!orden) return;
  await prisma.ordenTrabajo.update({
    where: { id },
    data: {
      estado: "completado",
      iniciadoEn: orden.iniciadoEn ?? new Date(),
      finalizadoEn: new Date(),
    },
  });
  refrescar(id);
}
