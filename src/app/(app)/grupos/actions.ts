"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { type FormState, zodToState, optionalStr, str } from "@/lib/form";

const grupoSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  descripcion: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido")
    .default("#2563eb"),
});

function parseGrupo(fd: FormData) {
  return grupoSchema.safeParse({
    nombre: str(fd, "nombre"),
    descripcion: optionalStr(fd, "descripcion"),
    color: str(fd, "color") || "#2563eb",
  });
}

export async function crearGrupo(
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseGrupo(fd);
  if (!parsed.success) return zodToState(parsed.error);
  const servicioIds = fd.getAll("servicioIds").map(String);

  await prisma.grupoServicio.create({
    data: {
      ...parsed.data,
      servicios: { connect: servicioIds.map((id) => ({ id })) },
    },
  });
  revalidatePath("/grupos");
  revalidatePath("/servicios");
  redirect("/grupos");
}

export async function actualizarGrupo(
  id: string,
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseGrupo(fd);
  if (!parsed.success) return zodToState(parsed.error);
  const servicioIds = fd.getAll("servicioIds").map(String);

  await prisma.grupoServicio.update({
    where: { id },
    data: {
      ...parsed.data,
      servicios: { set: servicioIds.map((id) => ({ id })) },
    },
  });
  revalidatePath("/grupos");
  revalidatePath("/servicios");
  redirect("/grupos");
}

export async function eliminarGrupo(id: string) {
  await prisma.grupoServicio.delete({ where: { id } });
  revalidatePath("/grupos");
  revalidatePath("/servicios");
  redirect("/grupos");
}
