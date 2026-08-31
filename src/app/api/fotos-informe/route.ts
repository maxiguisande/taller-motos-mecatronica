import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { currentUser } from "@/lib/session";

/**
 * Sube una foto suelta para un ítem de informe y devuelve su URL. Acá no se
 * persiste nada en la DB: el informe puede no existir todavía (se arma en el
 * formulario), así que la URL viaja con el ítem al guardar. Las que queden
 * sin referenciar se limpian en las actions de informes.
 */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || user.rol !== "admin")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "Falta archivo" }, { status: 400 });

  const blob = await put(`informes/${crypto.randomUUID()}.jpg`, file, {
    access: "public",
    contentType: "image/jpeg",
  });
  return NextResponse.json({ url: blob.url });
}
