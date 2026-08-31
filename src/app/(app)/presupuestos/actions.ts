"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { type FormState, zodToState, optionalStr, optionalNum, str } from "@/lib/form";

const presuSchema = z
  .object({
    // Cliente registrado o, si no lo hay, el nombre de quien pide el presupuesto.
    clienteId: z.string().optional(),
    contactoNombre: z.string().optional(),
    contactoTelefono: z.string().optional(),
    motoId: z.string().optional(),
    // Moto anotada a mano cuando no hay cliente registrado.
    motoMarca: z.string().optional(),
    motoModelo: z.string().optional(),
    motoAnio: z.coerce.number().int().min(1900).max(2100).optional(),
    motoPatente: z.string().optional(),
    titulo: z.string().optional(),
    estado: z.enum(["borrador", "enviado", "aprobado", "rechazado", "vencido"]),
    validezHasta: z.coerce.date().optional(),
    clienteTrae: z.string().optional(),
    notaFinal: z.string().optional(),
  })
  .refine((d) => d.clienteId || d.contactoNombre, {
    path: ["contactoNombre"],
    message: "Elegí un cliente o cargá el nombre de quien pide el presupuesto",
  });

const costoSchema = z.object({
  descripcion: z.string().min(1),
  importe: z.coerce.number().min(0),
  moneda: z.enum(["ARS", "USD"]),
});

function parsePresu(fd: FormData) {
  const v = optionalStr(fd, "validezHasta");
  return presuSchema.safeParse({
    clienteId: optionalStr(fd, "clienteId"),
    contactoNombre: optionalStr(fd, "contactoNombre"),
    contactoTelefono: optionalStr(fd, "contactoTelefono"),
    motoId: optionalStr(fd, "motoId"),
    motoMarca: optionalStr(fd, "motoMarca"),
    motoModelo: optionalStr(fd, "motoModelo"),
    motoAnio: optionalNum(fd, "motoAnio"),
    motoPatente: optionalStr(fd, "motoPatente"),
    titulo: optionalStr(fd, "titulo"),
    estado: str(fd, "estado") || "borrador",
    validezHasta: v,
    clienteTrae: optionalStr(fd, "clienteTrae"),
    notaFinal: optionalStr(fd, "notaFinal"),
  });
}

/**
 * Datos del presupuesto para Prisma. Con cliente registrado el contacto sale
 * de él (se limpian los datos sueltos); sin cliente no puede haber moto.
 */
function datosPresu(d: z.infer<typeof presuSchema>) {
  const {
    clienteId,
    contactoNombre,
    contactoTelefono,
    motoId,
    motoMarca,
    motoModelo,
    motoAnio,
    motoPatente,
    ...resto
  } = d;
  if (clienteId) {
    return {
      ...resto,
      clienteId,
      motoId: motoId || null,
      contactoNombre: null,
      contactoTelefono: null,
      motoMarca: null,
      motoModelo: null,
      motoAnio: null,
      motoPatente: null,
    };
  }
  return {
    ...resto,
    clienteId: null,
    motoId: null,
    contactoNombre: contactoNombre ?? null,
    contactoTelefono: contactoTelefono ?? null,
    motoMarca: motoMarca ?? null,
    motoModelo: motoModelo ?? null,
    motoAnio: motoAnio ?? null,
    motoPatente: motoPatente ?? null,
  };
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

  const presu = await prisma.presupuesto.create({
    data: {
      ...datosPresu(parsed.data),
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

  await prisma.$transaction([
    prisma.presupuestoServicio.deleteMany({ where: { presupuestoId: id } }),
    prisma.presupuestoItem.deleteMany({ where: { presupuestoId: id } }),
    prisma.presupuesto.update({
      where: { id },
      data: {
        ...datosPresu(parsed.data),
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
