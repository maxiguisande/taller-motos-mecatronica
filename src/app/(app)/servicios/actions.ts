"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { type FormState, zodToState, optionalStr, str } from "@/lib/form";

const servicioSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  descripcion: z.string().optional(),
  duracionMin: z.coerce.number().int().min(0).optional(),
  activo: z.boolean(),
});

function parseServicio(fd: FormData) {
  const duracion = str(fd, "duracionMin");
  return servicioSchema.safeParse({
    nombre: str(fd, "nombre"),
    descripcion: optionalStr(fd, "descripcion"),
    duracionMin: duracion === "" ? undefined : duracion,
    activo: fd.get("activo") === "on" || fd.get("activo") === "true",
  });
}

export async function crearServicio(
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseServicio(fd);
  if (!parsed.success) return zodToState(parsed.error);
  const grupoIds = fd.getAll("grupoIds").map(String);

  await prisma.servicio.create({
    data: {
      ...parsed.data,
      grupos: { connect: grupoIds.map((id) => ({ id })) },
    },
  });
  revalidatePath("/servicios");
  revalidatePath("/grupos");
  redirect("/servicios?ok=1");
}

export async function actualizarServicio(
  id: string,
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseServicio(fd);
  if (!parsed.success) return zodToState(parsed.error);
  const grupoIds = fd.getAll("grupoIds").map(String);

  await prisma.servicio.update({
    where: { id },
    data: {
      ...parsed.data,
      grupos: { set: grupoIds.map((id) => ({ id })) },
    },
  });
  revalidatePath("/servicios");
  revalidatePath("/grupos");
  redirect("/servicios?ok=1");
}

export async function eliminarServicio(id: string) {
  await prisma.servicio.delete({ where: { id } });
  revalidatePath("/servicios");
  revalidatePath("/grupos");
  redirect("/servicios?ok=Eliminado");
}
