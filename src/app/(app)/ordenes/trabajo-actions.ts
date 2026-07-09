"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";

/** Verifica que el usuario sea admin o el mecánico asignado; devuelve orden + usuario. */
async function puedeTrabajar(ordenId: string) {
  const user = await currentUser();
  if (!user) return null;
  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id: ordenId },
    select: { id: true, mecanicoId: true, iniciadoEn: true, finalizadoEn: true },
  });
  if (!orden) return null;
  if (user.rol === "admin" || orden.mecanicoId === user.id) return { orden, user };
  return null;
}

function refrescar(ordenId: string) {
  revalidatePath(`/ordenes/${ordenId}`);
  revalidatePath("/mis-tareas");
  revalidatePath("/ordenes");
}

export async function iniciarOrden(id: string) {
  const r = await puedeTrabajar(id);
  if (!r) return;
  // Reabrir una orden ya finalizada es solo para el admin.
  if (r.orden.finalizadoEn && r.user.rol !== "admin") return;
  await prisma.ordenTrabajo.update({
    where: { id },
    data: {
      estado: "en_proceso",
      iniciadoEn: r.orden.iniciadoEn ?? new Date(),
      finalizadoEn: null,
    },
  });
  refrescar(id);
}

export async function toggleTarea(itemId: string, ordenId: string) {
  const r = await puedeTrabajar(ordenId);
  if (!r) return;
  const item = await prisma.ordenItem.findUnique({ where: { id: itemId } });
  if (!item || item.ordenId !== ordenId) return;
  await prisma.ordenItem.update({
    where: { id: itemId },
    data: { realizado: !item.realizado },
  });
  refrescar(ordenId);
}

export async function finalizarOrden(id: string) {
  const r = await puedeTrabajar(id);
  if (!r) return;
  await prisma.ordenTrabajo.update({
    where: { id },
    data: {
      estado: "completado",
      iniciadoEn: r.orden.iniciadoEn ?? new Date(),
      finalizadoEn: new Date(),
    },
  });
  refrescar(id);
}
