import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { ImprimirButton } from "@/components/imprimir-button";
import { formatFecha, formatMoneda } from "@/lib/format";
import { numeroPresu, linkWhatsAppPresu, destinatarioPresu, motoPresu } from "@/lib/presupuesto";

export default async function PresupuestoPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const presu = await prisma.presupuesto.findUnique({
    where: { id },
    include: {
      cliente: { include: { contactos: true } },
      moto: true,
      servicios: true,
      items: true,
    },
  });
  if (!presu) notFound();

  // Cliente registrado o contacto suelto (presupuesto sin cliente).
  const dest = destinatarioPresu(presu);
  // Moto del cliente o la anotada a mano.
  const moto = motoPresu(presu);
  const waHref = linkWhatsAppPresu(
    {
      numero: presu.numero,
      titulo: presu.titulo,
      validezHasta: presu.validezHasta,
      moto,
      servicios: presu.servicios,
      items: presu.items.map((i) => ({ ...i, importe: Number(i.importe) })),
      clienteTrae: presu.clienteTrae,
      notaFinal: presu.notaFinal,
    },
    dest.telefono,
  );

  const totales: Record<string, number> = {};
  for (const i of presu.items)
    totales[i.moneda] = (totales[i.moneda] ?? 0) + Number(i.importe);
  const traeLista = (presu.clienteTrae ?? "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  const titulo =
    presu.titulo?.trim() || (moto ? `${moto.marca} ${moto.modelo}` : "Presupuesto");

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8 print:p-0">
      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <Link
          href={`/presupuestos/${id}`}
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
            <p className="text-lg font-bold text-slate-900">Presupuesto {numeroPresu(presu.numero)}</p>
            {presu.validezHasta && (
              <p className="text-xs text-slate-500">Válido hasta {formatFecha(presu.validezHasta)}</p>
            )}
          </div>
        </header>

        <div className="py-3">
          <p className="text-sm text-slate-500">
            {dest.nombre}
            {moto ? ` · ${moto.marca} ${moto.modelo}${moto.patente ? ` (${moto.patente})` : ""}` : ""}
          </p>
          <h1 className="text-lg font-bold text-slate-900">{titulo}</h1>
        </div>

        {presu.servicios.length > 0 && (
          <div className="border-t border-slate-100 py-3">
            <ul className="grid gap-x-6 gap-y-0.5 text-sm text-slate-700 sm:grid-cols-2">
              {presu.servicios.map((s) => (
                <li key={s.id}>• {s.descripcion}</li>
              ))}
            </ul>
          </div>
        )}

        {presu.items.length > 0 && (
          <table className="w-full border-t border-slate-200 text-sm">
            <tbody className="divide-y divide-slate-100">
              {presu.items.map((i) => (
                <tr key={i.id}>
                  <td className="py-2 text-slate-800">{i.descripcion}</td>
                  <td className="py-2 text-right font-medium text-slate-900">
                    {formatMoneda(Number(i.importe), i.moneda)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {Object.keys(totales).length > 0 && (
          <div className="flex flex-wrap justify-end gap-x-6 border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
            {Object.entries(totales).map(([m, v]) => (
              <span key={m}>Total {m}: {formatMoneda(v, m)}</span>
            ))}
          </div>
        )}

        {traeLista.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">Lo trae el cliente</p>
            <ul className="mt-1 text-slate-700">
              {traeLista.map((x, idx) => <li key={idx}>• {x}</li>)}
            </ul>
          </div>
        )}

        {presu.notaFinal?.trim() && (
          <p className="mt-4 border-t border-slate-100 pt-3 text-sm italic text-slate-600">
            {presu.notaFinal}
          </p>
        )}
      </div>
    </main>
  );
}
