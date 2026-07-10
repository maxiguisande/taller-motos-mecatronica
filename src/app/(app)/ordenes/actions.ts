"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { totalesOrden } from "@/lib/orden";
import { type FormState, zodToState, optionalStr, str } from "@/lib/form";

/** Marca una orden como pagada (acción rápida, solo admin). */
export async function marcarPagado(id: string, fd: FormData) {
  const user = await currentUser();
  if (!user || user.rol !== "admin") return;
  const medio = str(fd, "medioPago");
  await prisma.ordenTrabajo.update({
    where: { id },
    data: { estadoPago: "pagado", medioPago: medio || "efectivo" },
  });
  revalidatePath(`/ordenes/${id}`);
  revalidatePath("/ordenes");
  revalidatePath("/caja");
}

const itemSchema = z.object({
  id: z.string().nullish(), // presente en ítems que ya existían (para conservar sus fotos)
  tipo: z.enum(["servicio", "repuesto", "manual", "mano_obra"]).default("servicio"),
  servicioId: z.string().nullish(),
  productoId: z.string().nullish(),
  descripcion: z.string().min(1),
  precio: z.coerce.number().min(0),
  moneda: z.enum(["ARS", "USD"]).default("ARS"),
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
  estadoPago: z.enum(["pendiente", "parcial", "pagado"]),
  medioPago: z.string().optional(),
  notas: z.string().optional(),
});

function parseOrden(fd: FormData) {
  const km = str(fd, "kilometraje");
  return ordenSchema.safeParse({
    clienteId: str(fd, "clienteId"),
    motoId: optionalStr(fd, "motoId"),
    mecanicoId: optionalStr(fd, "mecanicoId"),
    fecha: str(fd, "fecha"),
    estado: str(fd, "estado") || "pendiente",
    kilometraje: km === "" ? undefined : km,
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

function oneItemData(i: Item) {
  return {
    tipo: i.tipo,
    servicioId: i.tipo === "servicio" ? i.servicioId || null : null,
    productoId: i.tipo === "repuesto" ? i.productoId || null : null,
    descripcion: i.descripcion,
    precio: i.precio,
    moneda: i.moneda,
    cantidad: i.cantidad,
  };
}
function itemData(items: Item[]) {
  return items.map(oneItemData);
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
    return { error: "Agregá al menos un servicio, repuesto o mano de obra a la orden." };

  const { motoId, ...data } = parsed.data;
  const totales = totalesOrden(items);
  const presupuestoId = optionalStr(fd, "presupuestoId") || null;
  const turnoId = optionalStr(fd, "turnoId") || null;

  const orden = await prisma.$transaction(async (tx) => {
    const o = await tx.ordenTrabajo.create({
      data: {
        ...data,
        motoId: motoId || null,
        presupuestoId,
        turnoId,
        totalArs: totales.ARS,
        totalUsd: totales.USD,
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
  redirect(`/ordenes/${orden.id}?ok=1`);
}

export async function actualizarOrden(
  id: string,
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseOrden(fd);
  if (!parsed.success) return zodToState(parsed.error);

  const actual = await prisma.ordenTrabajo.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!actual) return { error: "No se encontró la orden." };

  const { motoId, ...data } = parsed.data;
  const submitted = parseItems(fd);

  // En una orden completada NO se tocan los servicios/repuestos existentes:
  // solo se puede editar la mano de obra (el cobro) y las fotos.
  if (actual.estado === "completado") {
    const noLabor = actual.items.filter((i) => i.tipo !== "mano_obra");
    const labor = submitted.filter((i) => i.tipo === "mano_obra");
    const totales = totalesOrden([
      ...noLabor.map((i) => ({ precio: i.precio, cantidad: i.cantidad, moneda: i.moneda })),
      ...labor,
    ]);
    await prisma.$transaction(async (tx) => {
      await tx.ordenItem.deleteMany({ where: { ordenId: id, tipo: "mano_obra" } });
      await tx.ordenTrabajo.update({
        where: { id },
        data: {
          estadoPago: data.estadoPago,
          medioPago: data.medioPago,
          notas: data.notas,
          totalArs: totales.ARS,
          totalUsd: totales.USD,
          items: { create: itemData(labor) },
        },
      });
    });
    revalidatePath("/ordenes");
    revalidatePath(`/ordenes/${id}`);
    revalidatePath("/caja");
    redirect(`/ordenes/${id}?ok=1`);
  }

  // Orden no completada: se actualizan los ítems por id para conservar las
  // fotos de los que siguen; se borran solo los que se quitaron.
  if (submitted.length === 0)
    return { error: "Agregá al menos un servicio, repuesto o mano de obra a la orden." };
  const totales = totalesOrden(submitted);
  const currentIds = new Set(actual.items.map((i) => i.id));
  const submittedIds = new Set(
    submitted.filter((i) => i.id).map((i) => i.id as string),
  );
  const toDelete = actual.items.filter((i) => !submittedIds.has(i.id));

  await prisma.$transaction(async (tx) => {
    // Revertir el stock de los repuestos previos (después se aplica el nuevo).
    for (const it of actual.items) {
      if (it.tipo === "repuesto" && it.productoId) {
        await tx.producto.update({
          where: { id: it.productoId },
          data: { stock: { increment: it.cantidad } },
        });
      }
    }
    // Borrar los ítems quitados (sus fotos se borran en cascada).
    if (toDelete.length) {
      await tx.ordenItem.deleteMany({ where: { id: { in: toDelete.map((i) => i.id) } } });
    }
    // Actualizar los ítems que siguen (conserva sus fotos) y crear los nuevos.
    for (const it of submitted) {
      const d = oneItemData(it);
      if (it.id && currentIds.has(it.id)) {
        await tx.ordenItem.update({ where: { id: it.id }, data: d });
      } else {
        await tx.ordenItem.create({ data: { ...d, ordenId: id } });
      }
    }
    await tx.ordenTrabajo.update({
      where: { id },
      data: {
        ...data,
        motoId: motoId || null,
        totalArs: totales.ARS,
        totalUsd: totales.USD,
      },
    });
    // Aplicar stock de los repuestos nuevos.
    for (const [productoId, cant] of stockPorProducto(submitted)) {
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
  revalidatePath("/caja");
  revalidatePath(`/clientes/${data.clienteId}`);
  redirect(`/ordenes/${id}?ok=1`);
}

export async function eliminarOrden(id: string) {
  // Seguridad: una orden completada no se puede eliminar.
  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id },
    select: { estado: true },
  });
  if (!orden || orden.estado === "completado") {
    redirect(`/ordenes/${id}?ok=No se puede eliminar una orden completada`);
  }
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
  redirect("/ordenes?ok=Eliminado");
}
