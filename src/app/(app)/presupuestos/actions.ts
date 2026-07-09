"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { type FormState, zodToState, optionalStr, str } from "@/lib/form";

const presuSchema = z.object({
  clienteId: z.string().min(1, "Elegí un cliente"),
  motoId: z.string().optional(),
  titulo: z.string().optional(),
  estado: z.enum(["borrador", "enviado", "aprobado", "rechazado", "vencido"]),
  validezHasta: z.coerce.date().optional(),
  clienteTrae: z.string().optional(),
  notaFinal: z.string().optional(),
});

const costoSchema = z.object({
  descripcion: z.string().min(1),
  importe: z.coerce.number().min(0),
  moneda: z.enum(["ARS", "USD"]),
});

function parsePresu(fd: FormData) {
  const v = optionalStr(fd, "validezHasta");
  return presuSchema.safeParse({
    clienteId: str(fd, "clienteId"),
    motoId: optionalStr(fd, "motoId"),
    titulo: optionalStr(fd, "titulo"),
    estado: str(fd, "estado") || "borrador",
    validezHasta: v,
    clienteTrae: optionalStr(fd, "clienteTrae"),
    notaFinal: optionalStr(fd, "notaFinal"),
  });
}

function parseServicios(fd: FormData): string[] {
  try {
    const arr = JSON.parse(str(fd, "serviciosJson") || "[]");
    return z.array(z.string()).parse(arr).map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function parseCostos(fd: FormData) {
  try {
    const parsed = z.array(costoSchema).safeParse(JSON.parse(str(fd, "itemsJson") || "[]"));
    if (!parsed.success) return [];
    return parsed.data
      .filter((i) => i.descripcion.trim() !== "")
      .map((i) => ({ descripcion: i.descripcion.trim(), importe: i.importe, moneda: i.moneda }));
  } catch {
    return [];
  }
}

export async function crearPresupuesto(
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parsePresu(fd);
  if (!parsed.success) return zodToState(parsed.error);
  const { motoId, ...data } = parsed.data;

  const presu = await prisma.presupuesto.create({
    data: {
      ...data,
      motoId: motoId || null,
      servicios: { create: parseServicios(fd).map((d) => ({ descripcion: d })) },
      items: { create: parseCostos(fd) },
    },
  });
  revalidatePath("/presupuestos");
  redirect(`/presupuestos/${presu.id}?ok=1`);
}

export async function actualizarPresupuesto(
  id: string,
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parsePresu(fd);
  if (!parsed.success) return zodToState(parsed.error);
  const { motoId, ...data } = parsed.data;

  await prisma.$transaction([
    prisma.presupuestoServicio.deleteMany({ where: { presupuestoId: id } }),
    prisma.presupuestoItem.deleteMany({ where: { presupuestoId: id } }),
    prisma.presupuesto.update({
      where: { id },
      data: {
        ...data,
        motoId: motoId || null,
        servicios: { create: parseServicios(fd).map((d) => ({ descripcion: d })) },
        items: { create: parseCostos(fd) },
      },
    }),
  ]);
  revalidatePath("/presupuestos");
  revalidatePath(`/presupuestos/${id}`);
  redirect(`/presupuestos/${id}?ok=1`);
}

export async function eliminarPresupuesto(id: string) {
  await prisma.presupuesto.delete({ where: { id } });
  revalidatePath("/presupuestos");
  redirect("/presupuestos?ok=Eliminado");
}

/** Cambia el estado (enviado/aprobado/rechazado) desde el detalle. */
export async function cambiarEstadoPresupuesto(id: string, estado: string) {
  const user = await currentUser();
  if (!user || user.rol !== "admin") return;
  await prisma.presupuesto.update({ where: { id }, data: { estado } });
  revalidatePath(`/presupuestos/${id}`);
  revalidatePath("/presupuestos");
}

/** Crea una orden de trabajo copiando los servicios del presupuesto. */
export async function crearOrdenDesdePresupuesto(id: string) {
  const user = await currentUser();
  if (!user || user.rol !== "admin") return;
  const presu = await prisma.presupuesto.findUnique({
    where: { id },
    include: { servicios: true },
  });
  if (!presu) return;

  const orden = await prisma.ordenTrabajo.create({
    data: {
      clienteId: presu.clienteId,
      motoId: presu.motoId,
      presupuestoId: presu.id,
      estado: "pendiente",
      estadoPago: "pendiente",
      items: {
        create: presu.servicios.map((s) => ({
          tipo: "servicio",
          descripcion: s.descripcion,
          precio: 0,
          cantidad: 1,
        })),
      },
    },
  });
  revalidatePath("/ordenes");
  revalidatePath(`/presupuestos/${id}`);
  // Va al editor para completar mano de obra, repuestos, etc.
  redirect(`/ordenes/${orden.id}/editar`);
}
