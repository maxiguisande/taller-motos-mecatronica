import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";

/**
 * Sube o reemplaza la foto de la cédula de una moto. Queda guardada en la
 * ficha de la moto (no en la orden), así cualquier orden futura del mismo
 * cliente/moto ya la propone. Al cargar una nueva se pisa la anterior y el
 * blob viejo se borra.
 */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || user.rol !== "admin")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const fd = await req.formData();
  const file = fd.get("file");
  const motoId = String(fd.get("motoId") || "");
  if (!(file instanceof File) || !motoId)
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const moto = await prisma.moto.findUnique({
    where: { id: motoId },
    select: { id: true, clienteId: true, cedulaUrl: true },
  });
  if (!moto) return NextResponse.json({ error: "Moto inexistente" }, { status: 404 });

  const blob = await put(`motos/${motoId}/cedula/${crypto.randomUUID()}.jpg`, file, {
    access: "public",
    contentType: "image/jpeg",
  });
  // Primero se actualiza la ficha; recién después se borra el blob anterior.
  await prisma.moto.update({ where: { id: motoId }, data: { cedulaUrl: blob.url } });
  if (moto.cedulaUrl) await del(moto.cedulaUrl).catch(() => {});

  revalidatePath(`/clientes/${moto.clienteId}`);
  revalidatePath("/ordenes");
  return NextResponse.json({ url: blob.url });
}
