import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";

const MAX_POR_ITEM = 6;

/** Verifica que el usuario pueda tocar las fotos de ese ítem (admin o mecánico asignado). */
async function itemPermitido(ordenItemId: string, user: { id?: string; rol?: string }) {
  const item = await prisma.ordenItem.findUnique({
    where: { id: ordenItemId },
    include: { orden: { select: { id: true, mecanicoId: true } }, _count: { select: { fotos: true } } },
  });
  if (!item) return null;
  if (user.rol === "admin" || item.orden.mecanicoId === user.id) return item;
  return null;
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const fd = await req.formData();
  const file = fd.get("file");
  const ordenItemId = String(fd.get("ordenItemId") || "");
  if (!(file instanceof File) || !ordenItemId)
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const item = await itemPermitido(ordenItemId, user);
  if (!item) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  if (item._count.fotos >= MAX_POR_ITEM)
    return NextResponse.json({ error: `Máximo ${MAX_POR_ITEM} fotos por ítem` }, { status: 400 });

  const blob = await put(
    `ordenes/${item.orden.id}/${ordenItemId}/${crypto.randomUUID()}.jpg`,
    file,
    { access: "public", contentType: "image/jpeg" },
  );

  const foto = await prisma.foto.create({
    data: { ordenItemId, url: blob.url },
  });
  revalidatePath(`/ordenes/${item.orden.id}`);
  return NextResponse.json(foto);
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const foto = await prisma.foto.findUnique({
    where: { id },
    include: { item: { include: { orden: { select: { id: true, mecanicoId: true } } } } },
  });
  if (!foto) return NextResponse.json({ error: "No existe" }, { status: 404 });
  if (user.rol !== "admin" && foto.item.orden.mecanicoId !== user.id)
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  await del(foto.url).catch(() => {});
  await prisma.foto.delete({ where: { id } });
  revalidatePath(`/ordenes/${foto.item.orden.id}`);
  return NextResponse.json({ ok: true });
}
