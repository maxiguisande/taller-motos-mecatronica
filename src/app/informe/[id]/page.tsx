import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { ImprimirButton } from "@/components/imprimir-button";
import { formatFecha } from "@/lib/format";
import { numeroInforme, linkWhatsAppInforme } from "@/lib/informe";
import { destinatarioPresu, motoPresu } from "@/lib/presupuesto";

export default async function InformePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const informe = await prisma.informe.findUnique({
    where: { id },
    include: {
      cliente: { include: { contactos: true } },
      moto: true,
      items: true,
    },
  });
  if (!informe) notFound();

  const dest = destinatarioPresu(informe);
  // Moto del cliente o la anotada a mano.
  const moto = motoPresu(informe);
  const waHref = linkWhatsAppInforme(
    {
      numero: informe.numero,
      titulo: informe.titulo,
      fecha: informe.createdAt,
      moto,
      items: informe.items,
      notaFinal: informe.notaFinal,
    },
    dest.telefono,
  );
  const titulo =
    informe.titulo?.trim() || (moto ? `${moto.marca} ${moto.modelo}` : "Informe");

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8 print:p-0">
      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <Link
          href={`/informes/${id}`}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm text-slate-600 hover:bg-slate-200"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <div className="ml-auto flex gap-2">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <ImprimirButton />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none sm:p-8">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Mecatrónica Pilar" className="h-16 w-auto" />
            <div>
              <p className="font-bold text-slate-900">Mecatrónica Pilar</p>
              <p className="text-xs text-slate-500">Taller de Motos</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">Informe {numeroInforme(informe.numero)}</p>
            <p className="text-xs text-slate-500">{formatFecha(informe.createdAt)}</p>
          </div>
        </header>

        <div className="py-3">
          <p className="text-sm text-slate-500">
            {dest.nombre}
            {moto ? ` · ${moto.marca} ${moto.modelo}${moto.patente ? ` (${moto.patente})` : ""}` : ""}
          </p>
          <h1 className="text-lg font-bold text-slate-900">{titulo}</h1>
        </div>

        {informe.items.length > 0 && (
          <div className="border-t border-slate-100 py-3">
            <ul className="space-y-2 text-sm text-slate-700">
              {informe.items.map((i) => (
                <li key={i.id}>
                  • {i.descripcion}
                  {i.fotos.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2 pl-3">
                      {i.fotos.map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={url}
                          src={url}
                          alt="Foto del ítem"
                          className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                        />
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {informe.notaFinal?.trim() && (
          <p className="mt-4 border-t border-slate-100 pt-3 text-sm italic text-slate-600">
            {informe.notaFinal}
          </p>
        )}
      </div>
    </main>
  );
}
