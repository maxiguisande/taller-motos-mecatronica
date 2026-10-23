import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { ImprimirButton } from "@/components/imprimir-button";
import { armarLinkWhatsApp } from "@/lib/comprobante";
import { totalesOrden } from "@/lib/orden";
import { formatFecha, formatFechaHora, formatMoneda, formatOrdenNumero } from "@/lib/format";
import { ESTADO_PAGO_LABEL, MEDIO_PAGO_LABEL } from "@/lib/constants";
import { TALLER, CONDICIONES_SERVICIO } from "@/lib/taller";

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
      items: { include: { fotos: { orderBy: { createdAt: "asc" } } } },
      fotos: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!orden) notFound();

  const totales = totalesOrden(orden.items);
  const servicios = orden.items.filter((i) => i.tipo === "servicio");
  const otros = orden.items.filter((i) => i.tipo !== "servicio");
  const hayAdicionales = orden.items.some((i) => i.adicional);
  // Ingreso/egreso: si no se cargaron a mano, se toman del inicio/fin del trabajo.
  const ingreso = orden.ingresoEn ?? orden.iniciadoEn;
  const egreso = orden.egresoEn ?? orden.finalizadoEn;
  const fotosIngreso = orden.fotos.filter((f) => f.categoria === "ingreso");
  const fotosSalida = orden.fotos.filter((f) => f.categoria === "salida");
  const telefono =
    orden.cliente.contactos.find((c) => c.tipo === "whatsapp")?.valor ??
    orden.cliente.contactos.find((c) => c.tipo === "celular")?.valor ??
    orden.cliente.contactos.find((c) => c.principal)?.valor ??
    null;
  const email = orden.cliente.contactos.find((c) => c.tipo === "email")?.valor ?? null;
  const waHref = armarLinkWhatsApp(orden, telefono);

  // Datos de contacto del taller para el encabezado (solo los cargados).
  const contactoTaller = [TALLER.direccion, TALLER.telefono, TALLER.email]
    .filter(Boolean)
    .join(" · ");

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

      {/* Orden de trabajo */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none sm:p-8">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt={TALLER.nombre} className="h-16 w-auto" />
              <div>
                <p className="font-bold text-slate-900">{TALLER.nombre}</p>
                <p className="text-xs text-slate-500">{TALLER.subtitulo}</p>
              </div>
            </div>
            <div className="mt-2 text-[11px] leading-snug text-slate-500">
              {TALLER.responsable && <p>Responsable: {TALLER.responsable}</p>}
              {TALLER.cuit && <p>CUIT: {TALLER.cuit}</p>}
              {contactoTaller && <p>{contactoTaller}</p>}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Orden de trabajo
            </p>
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
            {orden.cliente.dni && <p className="text-slate-500">DNI {orden.cliente.dni}</p>}
            {orden.cliente.direccion && (
              <p className="text-slate-500">{orden.cliente.direccion}</p>
            )}
            {telefono && <p className="text-slate-500">{telefono}</p>}
            {email && <p className="text-slate-500">{email}</p>}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Vehículo</p>
            <p className="font-medium text-slate-900">
              {orden.moto
                ? `${orden.moto.marca} ${orden.moto.modelo}${
                    orden.moto.anio ? ` ${orden.moto.anio}` : ""
                  }${orden.moto.patente ? ` (${orden.moto.patente})` : ""}`
                : "Sin especificar"}
            </p>
            {orden.moto?.numeroChasis && (
              <p className="text-slate-500">Chasis {orden.moto.numeroChasis}</p>
            )}
            {orden.kilometraje != null && (
              <p className="text-slate-500">
                {orden.kilometraje.toLocaleString("es-AR")} km
              </p>
            )}
          </div>
        </section>

        {/* Siempre visible: si falta el dato, quedan puntos para completar a mano. */}
        <section className="border-y border-slate-100 py-2 text-sm">
          <p className="text-slate-700">
            <span className="text-xs uppercase tracking-wide text-slate-400">Ingreso de la unidad: </span>
            <span className="font-medium">
              {ingreso ? `${formatFechaHora(ingreso)} hs` : "……………………………"}
            </span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="text-xs uppercase tracking-wide text-slate-400">Egreso: </span>
            <span className="font-medium">
              {egreso ? `${formatFechaHora(egreso)} hs` : "……………………………"}
            </span>
          </p>
        </section>

        {servicios.length > 0 && (
          <section className="py-2">
            <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">
              Detalle del trabajo
            </p>
            <ul className="grid gap-x-6 gap-y-0.5 text-sm text-slate-700 sm:grid-cols-2">
              {servicios.map((s) => (
                <li key={s.id}>
                  • {s.descripcion}
                  {s.adicional && (
                    <span className="text-xs font-semibold text-slate-500"> (ADICIONAL)</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2 font-medium">Concepto</th>
              <th className="py-2 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {otros.map((i) => (
              <tr key={i.id}>
                <td className="py-2 text-slate-800">
                  {i.descripcion}
                  {i.cantidad > 1 ? ` (x${i.cantidad})` : ""}
                  {i.provistoPor === "cliente" && (
                    <span className="text-xs text-slate-500">
                      {" "}
                      · provisto por el cliente (sin garantía)
                    </span>
                  )}
                  {i.adicional && (
                    <span className="text-xs font-semibold text-slate-500"> · ADICIONAL</span>
                  )}
                </td>
                <td className="py-2 text-right text-slate-800">
                  {formatMoneda(Number(i.precio) * i.cantidad, i.moneda)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
          {(totales.ARS !== 0 || totales.USD === 0) && (
            <div className="flex justify-between border-t border-slate-200 pt-1 text-lg font-bold text-slate-900">
              <span>Valor total (pesos)</span>
              <span>{formatMoneda(totales.ARS, "ARS")}</span>
            </div>
          )}
          {totales.USD !== 0 && (
            <div className="flex justify-between border-t border-slate-200 pt-1 text-lg font-bold text-slate-900">
              <span>Valor total (dólares)</span>
              <span>{formatMoneda(totales.USD, "USD")}</span>
            </div>
          )}
          <p className="pt-1 text-right text-xs text-slate-500">
            Pago: {ESTADO_PAGO_LABEL[orden.estadoPago] ?? orden.estadoPago}
            {orden.medioPago
              ? ` · ${MEDIO_PAGO_LABEL[orden.medioPago] ?? orden.medioPago}`
              : ""}
          </p>
        </div>

        {hayAdicionales && (
          <p className="mt-2 text-[11px] text-slate-500">
            Los ítems marcados como ADICIONAL fueron comunicados al cliente junto con su
            valor y realizados con su conformidad.
          </p>
        )}

        {/* Al imprimir, de acá en adelante (observaciones, fotos, condiciones
            y firmas) arranca en la página siguiente. */}
        <div className="print:break-before-page">
        {orden.notas && (
          <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">Observaciones</p>
            <p className="whitespace-pre-wrap text-slate-700">{orden.notas}</p>
          </div>
        )}

        {fotosIngreso.length > 0 && (
          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
              Condición de la unidad al ingreso
            </p>
            <div className="flex flex-wrap gap-2">
              {fotosIngreso.map((f) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={f.id}
                  src={f.url}
                  alt="Ingreso"
                  className="h-28 w-28 rounded-lg border border-slate-200 object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {fotosSalida.length > 0 && (
          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
              Condición de la unidad al egreso
            </p>
            <div className="flex flex-wrap gap-2">
              {fotosSalida.map((f) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={f.id}
                  src={f.url}
                  alt="Salida"
                  className="h-28 w-28 rounded-lg border border-slate-200 object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {orden.moto?.cedulaUrl && (
          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
              Cédula del vehículo
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={orden.moto.cedulaUrl}
              alt="Cédula del vehículo"
              className="h-44 w-auto max-w-full rounded-lg border border-slate-200 object-contain"
            />
          </div>
        )}

        {orden.items.some((i) => i.fotos.length > 0) && (
          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
              Fotos del trabajo
            </p>
            <div className="space-y-3">
              {orden.items
                .filter((i) => i.fotos.length > 0)
                .map((i) => (
                  <div key={i.id}>
                    <p className="mb-1 text-sm font-medium text-slate-700">
                      {i.descripcion}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {i.fotos.map((f) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={f.id}
                          src={f.url}
                          alt={i.descripcion}
                          className="h-28 w-28 rounded-lg border border-slate-200 object-cover"
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Condiciones de servicio + conformidad */}
        <div className="mt-6 border-t border-slate-200 pt-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Condiciones de servicio
          </p>
          <ol className="list-decimal space-y-0.5 pl-4 text-[11px] leading-snug text-slate-500">
            {CONDICIONES_SERVICIO.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ol>
          <p className="mt-2 text-[11px] text-slate-600">
            El cliente declara conocer y aceptar las condiciones de servicio de esta orden.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-10 text-center text-xs text-slate-600">
          <div className="border-t border-slate-400 pt-1">
            <p>Firma y aclaración del cliente</p>
            <p className="text-slate-500">DNI: {orden.cliente.dni ?? "………………………"}</p>
          </div>
          <div className="border-t border-slate-400 pt-1">
            <p>Firma del responsable del taller</p>
            {TALLER.responsable && <p className="text-slate-500">{TALLER.responsable}</p>}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          ¡Gracias por confiar en {TALLER.nombre}!
        </p>
        </div>
      </div>
    </main>
  );
}
