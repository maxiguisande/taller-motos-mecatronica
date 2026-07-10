"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { type FormState, zodToState, optionalStr, str } from "@/lib/form";

const turnoSchema = z.object({
  clienteId: z.string().min(1, "Elegí un cliente"),
  motoId: z.string().optional(),
  fecha: z.coerce.date(),
  motivo: z.string().optional(),
  estado: z.enum(["confirmado", "cancelado"]),
  notas: z.string().optional(),
});

function parseTurno(fd: FormData) {
  return turnoSchema.safeParse({
    clienteId: str(fd, "clienteId"),
    motoId: optionalStr(fd, "motoId"),
    fecha: str(fd, "fecha"),
    motivo: optionalStr(fd, "motivo"),
    estado: str(fd, "estado") || "confirmado",
    notas: optionalStr(fd, "notas"),
  });
}

export async function crearTurno(
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseTurno(fd);
  if (!parsed.success) return zodToState(parsed.error);
  const { motoId, ...data } = parsed.data;
  const presupuestoId = optionalStr(fd, "presupuestoId") || null;
  await prisma.turno.create({
    data: { ...data, motoId: motoId || null, presupuestoId },
  });
  revalidatePath("/turnos");
  redirect("/turnos?ok=1");
}

export async function actualizarTurno(
  id: string,
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseTurno(fd);
  if (!parsed.success) return zodToState(parsed.error);
  const { motoId, ...data } = parsed.data;
  await prisma.turno.update({ where: { id }, data: { ...data, motoId: motoId || null } });
  revalidatePath("/turnos");
  redirect("/turnos?ok=1");
}

export async function eliminarTurno(id: string) {
  // Seguridad: si el turno generó una orden que ya se completó, no se elimina.
  const conOrdenCompletada = await prisma.ordenTrabajo.count({
    where: { turnoId: id, estado: "completado" },
  });
  if (conOrdenCompletada > 0) {
    redirect(`/turnos/${id}?ok=No se puede eliminar: el turno tiene una orden completada`);
  }
  await prisma.turno.delete({ where: { id } });
  revalidatePath("/turnos");
  redirect("/turnos?ok=Eliminado");
}

/** Cambia el estado de un turno (confirmado/cancelado). */
export async function cambiarEstadoTurno(id: string, estado: string) {
  await prisma.turno.update({ where: { id }, data: { estado } });
  revalidatePath("/turnos");
  revalidatePath(`/turnos/${id}`);
}
