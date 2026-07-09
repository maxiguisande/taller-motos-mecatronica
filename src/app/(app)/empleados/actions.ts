"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { type FormState, zodToState, str } from "@/lib/form";

const baseSchema = {
  nombre: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
  rol: z.enum(["admin", "empleado"]),
  activo: z.boolean(),
};

const crearSchema = z.object({
  ...baseSchema,
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const editarSchema = z.object({
  ...baseSchema,
  password: z
    .union([z.string().min(6, "Mínimo 6 caracteres"), z.literal("")])
    .optional(),
});

function comun(fd: FormData) {
  return {
    nombre: str(fd, "nombre"),
    email: str(fd, "email").toLowerCase(),
    rol: str(fd, "rol") || "empleado",
    activo: fd.get("activo") === "on" || fd.get("activo") === "true",
    password: str(fd, "password"),
  };
}

export async function crearEmpleado(
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = crearSchema.safeParse(comun(fd));
  if (!parsed.success) return zodToState(parsed.error);

  const { password, ...data } = parsed.data;
  try {
    await prisma.user.create({
      data: { ...data, passwordHash: await bcrypt.hash(password, 10) },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { error: "Ya existe un usuario con ese email." };
    throw e;
  }
  revalidatePath("/empleados");
  redirect("/empleados?ok=1");
}

export async function actualizarEmpleado(
  id: string,
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = editarSchema.safeParse(comun(fd));
  if (!parsed.success) return zodToState(parsed.error);

  const { password, ...data } = parsed.data;
  try {
    await prisma.user.update({
      where: { id },
      data: {
        ...data,
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { error: "Ya existe un usuario con ese email." };
    throw e;
  }
  revalidatePath("/empleados");
  redirect("/empleados?ok=1");
}

export async function eliminarEmpleado(id: string) {
  const admin = await requireAdmin();
  if (admin.id === id) {
    // No permitimos que se borre a sí mismo.
    redirect("/empleados");
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/empleados");
  redirect("/empleados?ok=Eliminado");
}
