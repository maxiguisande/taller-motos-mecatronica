"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { type FormState, zodToState, optionalStr, optionalNum, str } from "@/lib/form";

const informeSchema = z
  .object({
    // Cliente registrado o, si no lo hay, el nombre del destinatario.
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
    notaFinal: z.string().optional(),
  })
  .refine((d) => d.clienteId || d.contactoNombre, {
    path: ["contactoNombre"],
    message: "Elegí un cliente o cargá a nombre de quién va el informe",
  });

function parseInforme(fd: FormData) {
  return informeSchema.safeParse({
    clienteId: optionalStr(fd, "clienteId"),
    contactoNombre: optionalStr(fd, "contactoNombre"),
    contactoTelefono: optionalStr(fd, "contactoTelefono"),
    motoId: optionalStr(fd, "motoId"),
    motoMarca: optionalStr(fd, "motoMarca"),
    motoModelo: optionalStr(fd, "motoModelo"),
    motoAnio: optionalNum(fd, "motoAnio"),
    motoPatente: optionalStr(fd, "motoPatente"),
    titulo: optionalStr(fd, "titulo"),
    notaFinal: optionalStr(fd, "notaFinal"),
  });
}

/**
 * Igual que en presupuestos: con cliente registrado se limpian los datos
 * sueltos; sin cliente no puede haber moto.
 */
function datosInforme(d: z.infer<typeof informeSchema>) {
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

const itemSchema = z.object({
  descripcion: z.string(),
  fotos: z.array(z.string()).optional(),
});

function parseItems(fd: FormData) {
  try {
    const parsed = z.array(itemSchema).safeParse(JSON.parse(str(fd, "itemsJson") || "[]"));
    if (!parsed.success) return [];
    return parsed.data
      .filter((i) => i.descripcion.trim() !== "")
      .map((i) => ({
        descripcion: i.descripcion.trim(),
        // Hasta 3 fotos por ítem (URLs subidas a Vercel Blob desde el form).
        fotos: (i.fotos ?? []).filter((u) => u.startsWith("https://")).slice(0, 3),
      }));
  } catch {
    return [];
  }
}

/** Borra del Blob las fotos de informes que quedaron sin referenciar. */
async function borrarFotosBlob(urls: string[]) {
  const propias = urls.filter((u) => u.includes("/informes/"));
  if (propias.length) await del(propias).catch(() => {});
}

export async function crearInforme(
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseInforme(fd);
  if (!parsed.success) return zodToState(parsed.error);

  const informe = await prisma.informe.create({
    data: {
      ...datosInforme(parsed.data),
      items: { create: parseItems(fd) },
    },
  });
  revalidatePath("/informes");
  redirect(`/informes/${informe.id}?ok=1`);
}

export async function actualizarInforme(
  id: string,
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseInforme(fd);
  if (!parsed.success) return zodToState(parsed.error);
  const items = parseItems(fd);

  // Fotos que estaban guardadas y ya no vienen en ningún ítem: se borran del Blob.
  const viejas = (
    await prisma.informeItem.findMany({ where: { informeId: id }, select: { fotos: true } })
  ).flatMap((i) => i.fotos);
  const vigentes = new Set(items.flatMap((i) => i.fotos));

  await prisma.$transaction([
    prisma.informeItem.deleteMany({ where: { informeId: id } }),
    prisma.informe.update({
      where: { id },
      data: {
        ...datosInforme(parsed.data),
        items: { create: items },
      },
    }),
  ]);
  await borrarFotosBlob(viejas.filter((u) => !vigentes.has(u)));
  revalidatePath("/informes");
  revalidatePath(`/informes/${id}`);
  redirect(`/informes/${id}?ok=1`);
}

export async function eliminarInforme(id: string) {
  const items = await prisma.informeItem.findMany({
    where: { informeId: id },
    select: { fotos: true },
  });
  await prisma.informe.delete({ where: { id } });
  await borrarFotosBlob(items.flatMap((i) => i.fotos));
  revalidatePath("/informes");
  redirect("/informes?ok=Eliminado");
}
