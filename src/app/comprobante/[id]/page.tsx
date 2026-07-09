import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { ImprimirButton } from "@/components/imprimir-button";
import { armarLinkWhatsApp } from "@/lib/comprobante";
import { formatFecha, formatMoneda, formatOrdenNumero } from "@/lib/format";
import { ESTADO_PAGO_LABEL, MEDIO_PAGO_LABEL } from "@/lib/constants";

export default async function ComprobantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id },
    include: {
      cliente: { include: { contactos: true } },
      moto: true,
      items: true,
    },
  });
  if (!orden) notFound();

  const descuento = Number(orden.descuento);
  const subtotal = orden.items.reduce(
    (acc, i) => acc + Number(i.precio) * i.cantidad,
    0,
  );
  const telefono =
    orden.cliente.contactos.find((c) => c.tipo === "whatsapp")?.valor ??
    orden.cliente.contactos.find((c) => c.tipo === "celular")?.valor ??
    orden.cliente.contactos.find((c) => c.principal)?.valor ??
    null;
  const waHref = armarLinkWhatsApp(orden, telefono);

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8 print:p-0">
      {/* Barra de acciones (no se imprime) */}
      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <Link
          href={`/ordenes/${id}`}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm text-slate-600 hover:bg-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <div className="ml-auto flex gap-2">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <ImprimirButton />
        </div>
      </div>

      {/* Comprobante */}
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
            <p className="text-lg font-bold text-slate-900">
              {formatOrdenNumero(orden.numero)}
            </p>
            <p className="text-xs text-slate-500">{formatFecha(orden.fecha)}</p>
          </div>
        </header>

        <section className="grid gap-4 py-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Cliente</p>
            <p className="font-medium text-slate-900">
              {orden.cliente.nombre} {orden.cliente.apellido}
            </p>
            {telefono && <p className="text-slate-500">{telefono}</p>}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Moto</p>
            <p className="font-medium text-slate-900">
              {orden.moto
                ? `${orden.moto.marca} ${orden.moto.modelo}${
                    orden.moto.patente ? ` (${orden.moto.patente})` : ""
                  }`
                : "Sin especificar"}
            </p>
            {orden.kilometraje != null && (
              <p className="text-slate-500">
                {orden.kilometraje.toLocaleString("es-AR")} km
              </p>
            )}
          </div>
        </section>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2 font-medium">Detalle</th>
              <th className="py-2 text-center font-medium">Cant.</th>
              <th className="py-2 text-right font-medium">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orden.items.map((i) => (
              <tr key={i.id}>
                <td className="py-2 text-slate-800">{i.descripcion}</td>
                <td className="py-2 text-center text-slate-500">{i.cantidad}</td>
                <td className="py-2 text-right text-slate-800">
                  {formatMoneda(Number(i.precio) * i.cantidad)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span>{formatMoneda(subtotal)}</span>
          </div>
          {descuento > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Descuento</span>
              <span>− {formatMoneda(descuento)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-1 text-lg font-bold text-slate-900">
            <span>Total</span>
            <span>{formatMoneda(orden.total)}</span>
          </div>
          <p className="pt-1 text-right text-xs text-slate-500">
            Pago: {ESTADO_PAGO_LABEL[orden.estadoPago] ?? orden.estadoPago}
            {orden.medioPago
              ? ` · ${MEDIO_PAGO_LABEL[orden.medioPago] ?? orden.medioPago}`
              : ""}
          </p>
        </div>

        {orden.notas && (
          <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">Notas</p>
            <p className="whitespace-pre-wrap text-slate-700">{orden.notas}</p>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          ¡Gracias por confiar en Mecatrónica Pilar!
        </p>
      </div>
    </main>
  );
}
