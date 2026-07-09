import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";

const MAX_POR_GRUPO = 6;
const CATEGORIAS = ["ingreso", "salida"];

type User = { id?: string; rol?: string };

function puede(user: User, mecanicoId: string | null) {
  return user.rol === "admin" || (!!user.id && mecanicoId === user.id);
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const fd = await req.formData();
  const file = fd.get("file");
  const ordenItemId = String(fd.get("ordenItemId") || "");
  const ordenId = String(fd.get("ordenId") || "");
  const categoria = String(fd.get("categoria") || "");
  if (!(file instanceof File)) return NextResponse.json({ error: "Falta archivo" }, { status: 400 });

  let path: string;
  let data: { ordenItemId?: string; ordenId?: string; categoria: string };
  let revalId: string;
  let usados: number;

  if (ordenItemId) {
    // Foto de un ítem.
    const item = await prisma.ordenItem.findUnique({
      where: { id: ordenItemId },
      include: { orden: { select: { id: true, mecanicoId: true } }, _count: { select: { fotos: true } } },
    });
    if (!item) return NextResponse.json({ error: "Ítem inexistente" }, { status: 404 });
    if (!puede(user, item.orden.mecanicoId)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    usados = item._count.fotos;
    path = `ordenes/${item.orden.id}/items/${ordenItemId}`;
    data = { ordenItemId, categoria: "item" };
    revalId = item.orden.id;
  } else if (ordenId && CATEGORIAS.includes(categoria)) {
    // Foto de ingreso/salida de la orden.
    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id: ordenId },
      select: { id: true, mecanicoId: true, _count: { select: { fotos: { where: { categoria } } } } },
    });
    if (!orden) return NextResponse.json({ error: "Orden inexistente" }, { status: 404 });
    if (!puede(user, orden.mecanicoId)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    usados = orden._count.fotos;
    path = `ordenes/${ordenId}/${categoria}`;
    data = { ordenId, categoria };
    revalId = ordenId;
  } else {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (usados >= MAX_POR_GRUPO)
    return NextResponse.json({ error: `Máximo ${MAX_POR_GRUPO} fotos` }, { status: 400 });

  const blob = await put(`${path}/${crypto.randomUUID()}.jpg`, file, {
    access: "public",
    contentType: "image/jpeg",
  });
  const foto = await prisma.foto.create({ data: { ...data, url: blob.url } });
  revalidatePath(`/ordenes/${revalId}`);
  return NextResponse.json(foto);
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const foto = await prisma.foto.findUnique({
    where: { id },
    include: {
      item: { include: { orden: { select: { id: true, mecanicoId: true } } } },
      orden: { select: { id: true, mecanicoId: true } },
    },
  });
  if (!foto) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const orden = foto.orden ?? foto.item?.orden;
  if (!orden || !puede(user, orden.mecanicoId))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  await del(foto.url).catch(() => {});
  await prisma.foto.delete({ where: { id } });
  revalidatePath(`/ordenes/${orden.id}`);
  return NextResponse.json({ ok: true });
}
