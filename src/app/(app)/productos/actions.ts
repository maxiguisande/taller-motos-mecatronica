"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { type FormState, zodToState, optionalStr, str } from "@/lib/form";

const productoSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  descripcion: z.string().optional(),
  precio: z.coerce.number().min(0, "El precio no puede ser negativo"),
  costo: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int(),
  stockMinimo: z.coerce.number().int().min(0),
  activo: z.boolean(),
});

function parseProducto(fd: FormData) {
  const costo = str(fd, "costo");
  return productoSchema.safeParse({
    nombre: str(fd, "nombre"),
    descripcion: optionalStr(fd, "descripcion"),
    precio: str(fd, "precio") || 0,
    costo: costo === "" ? undefined : costo,
    stock: str(fd, "stock") || 0,
    stockMinimo: str(fd, "stockMinimo") || 0,
    activo: fd.get("activo") === "on" || fd.get("activo") === "true",
  });
}

export async function crearProducto(
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseProducto(fd);
  if (!parsed.success) return zodToState(parsed.error);
  await prisma.producto.create({ data: parsed.data });
  revalidatePath("/productos");
  redirect("/productos");
}

export async function actualizarProducto(
  id: string,
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseProducto(fd);
  if (!parsed.success) return zodToState(parsed.error);
  await prisma.producto.update({ where: { id }, data: parsed.data });
  revalidatePath("/productos");
  redirect("/productos");
}

export async function eliminarProducto(id: string) {
  await prisma.producto.delete({ where: { id } });
  revalidatePath("/productos");
  redirect("/productos");
}

/** Ajuste rápido de stock (+/-) desde el listado. */
export async function ajustarStock(id: string, delta: number) {
  await prisma.producto.update({
    where: { id },
    data: { stock: { increment: delta } },
  });
  revalidatePath("/productos");
}
