"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { type FormState, zodToState, optionalStr, str } from "@/lib/form";

const itemSchema = z.object({
  tipo: z.enum(["servicio", "repuesto", "manual"]).default("servicio"),
  servicioId: z.string().nullish(),
  productoId: z.string().nullish(),
  descripcion: z.string().min(1),
  precio: z.coerce.number().min(0),
  cantidad: z.coerce.number().int().min(1),
});
type Item = z.infer<typeof itemSchema>;

const ordenSchema = z.object({
  clienteId: z.string().min(1, "Elegí un cliente"),
  motoId: z.string().optional(),
  mecanicoId: z.string().optional(),
  fecha: z.coerce.date(),
  estado: z.enum(["pendiente", "en_proceso", "completado"]),
  kilometraje: z.coerce.number().int().min(0).optional(),
  descuento: z.coerce.number().min(0).optional(),
  estadoPago: z.enum(["pendiente", "parcial", "pagado"]),
  medioPago: z.string().optional(),
  notas: z.string().optional(),
});

function parseOrden(fd: FormData) {
  const km = str(fd, "kilometraje");
  const desc = str(fd, "descuento");
  return ordenSchema.safeParse({
    clienteId: str(fd, "clienteId"),
    motoId: optionalStr(fd, "motoId"),
    mecanicoId: optionalStr(fd, "mecanicoId"),
    fecha: str(fd, "fecha"),
    estado: str(fd, "estado") || "pendiente",
    kilometraje: km === "" ? undefined : km,
    descuento: desc === "" ? undefined : desc,
    estadoPago: str(fd, "estadoPago") || "pendiente",
    medioPago: optionalStr(fd, "medioPago"),
    notas: optionalStr(fd, "notas"),
  });
}

function parseItems(fd: FormData): Item[] {
  const raw = str(fd, "itemsJson");
  if (!raw) return [];
  try {
    const parsed = z.array(itemSchema).safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function itemData(items: Item[]) {
  return items.map((i) => ({
    tipo: i.tipo,
    servicioId: i.tipo === "servicio" ? i.servicioId || null : null,
    productoId: i.tipo === "repuesto" ? i.productoId || null : null,
    descripcion: i.descripcion,
    precio: i.precio,
    cantidad: i.cantidad,
  }));
}

/** Suma de cantidades por producto, para ajustar stock. */
function stockPorProducto(items: Item[]) {
  const map = new Map<string, number>();
  for (const i of items) {
    if (i.tipo === "repuesto" && i.productoId) {
      map.set(i.productoId, (map.get(i.productoId) ?? 0) + i.cantidad);
    }
  }
  return map;
}

async function actualizarKmMoto(
  tx: Prisma.TransactionClient,
  motoId: string | undefined,
  km: number | undefined,
) {
  if (!motoId || km == null) return;
  const moto = await tx.moto.findUnique({ where: { id: motoId } });
  if (moto && (moto.kmActual == null || km > moto.kmActual)) {
    await tx.moto.update({ where: { id: motoId }, data: { kmActual: km } });
  }
}

export async function crearOrden(
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseOrden(fd);
  if (!parsed.success) return zodToState(parsed.error);

  const items = parseItems(fd);
  if (items.length === 0)
    return { error: "Agregá al menos un servicio o repuesto a la orden." };

  const { motoId, descuento = 0, ...data } = parsed.data;
  const subtotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const total = Math.max(0, subtotal - descuento);

  const orden = await prisma.$transaction(async (tx) => {
    const o = await tx.ordenTrabajo.create({
      data: {
        ...data,
        motoId: motoId || null,
        descuento,
        total,
        items: { create: itemData(items) },
      },
    });
    for (const [productoId, cant] of stockPorProducto(items)) {
      await tx.producto.update({
        where: { id: productoId },
        data: { stock: { decrement: cant } },
      });
    }
    await actualizarKmMoto(tx, motoId, parsed.data.kilometraje);
    return o;
  });

  revalidatePath("/ordenes");
  revalidatePath("/productos");
  revalidatePath(`/clientes/${data.clienteId}`);
  redirect(`/ordenes/${orden.id}`);
}

export async function actualizarOrden(
  id: string,
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseOrden(fd);
  if (!parsed.success) return zodToState(parsed.error);

  const items = parseItems(fd);
  if (items.length === 0)
    return { error: "Agregá al menos un servicio o repuesto a la orden." };

  const { motoId, descuento = 0, ...data } = parsed.data;
  const subtotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const total = Math.max(0, subtotal - descuento);

  await prisma.$transaction(async (tx) => {
    // Reponer stock de los repuestos que tenía la orden anterior.
    const previos = await tx.ordenItem.findMany({ where: { ordenId: id } });
    for (const it of previos) {
      if (it.tipo === "repuesto" && it.productoId) {
        await tx.producto.update({
          where: { id: it.productoId },
          data: { stock: { increment: it.cantidad } },
        });
      }
    }
    await tx.ordenItem.deleteMany({ where: { ordenId: id } });
    await tx.ordenTrabajo.update({
      where: { id },
      data: {
        ...data,
        motoId: motoId || null,
        descuento,
        total,
        items: { create: itemData(items) },
      },
    });
    // Descontar stock de los repuestos nuevos.
    for (const [productoId, cant] of stockPorProducto(items)) {
      await tx.producto.update({
        where: { id: productoId },
        data: { stock: { decrement: cant } },
      });
    }
    await actualizarKmMoto(tx, motoId, parsed.data.kilometraje);
  });

  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${id}`);
  revalidatePath("/productos");
  revalidatePath(`/clientes/${data.clienteId}`);
  redirect(`/ordenes/${id}`);
}

export async function eliminarOrden(id: string) {
  await prisma.$transaction(async (tx) => {
    const items = await tx.ordenItem.findMany({ where: { ordenId: id } });
    for (const it of items) {
      if (it.tipo === "repuesto" && it.productoId) {
        await tx.producto.update({
          where: { id: it.productoId },
          data: { stock: { increment: it.cantidad } },
        });
      }
    }
    await tx.ordenTrabajo.delete({ where: { id } });
  });

  revalidatePath("/ordenes");
  revalidatePath("/productos");
  redirect("/ordenes");
}
