import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Pencil,
  MessageCircle,
  Printer,
  Send,
  CheckCircle2,
  XCircle,
  CalendarPlus,
  CalendarClock,
  ClipboardList,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { BackButton } from "@/components/back-button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { formatFecha, formatFechaHora, formatMoneda } from "@/lib/format";
import { numeroPresu, linkWhatsAppPresu, destinatarioPresu, motoPresu } from "@/lib/presupuesto";
import {
  ESTADO_PRESU_COLOR,
  ESTADO_PRESU_LABEL,
  ESTADO_TURNO_COLOR,
  ESTADO_TURNO_LABEL,
} from "@/lib/constants";
import { eliminarPresupuesto, cambiarEstadoPresupuesto } from "../actions";
import { vencerPresupuestosVencidos } from "../data";

export default async function PresupuestoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await vencerPresupuestosVencidos();
  const presu = await prisma.presupuesto.findUnique({
    where: { id },
    include: {
      cliente: { include: { contactos: true } },
      moto: true,
      servicios: true,
      items: true,
      ordenes: { select: { id: true, numero: true } },
      turnos: {
        select: { id: true, fecha: true, estado: true },
        orderBy: { fecha: "asc" },
      },
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
  // Para dar de alta al contacto suelto como cliente y volver acá con él ya elegido.
  const altaParams = new URLSearchParams({ returnTo: `/presupuestos/${id}/editar` });
  if (presu.contactoNombre) altaParams.set("nombre", presu.contactoNombre);
  if (presu.contactoTelefono) altaParams.set("telefono", presu.contactoTelefono);
  if (presu.motoMarca) altaParams.set("marca", presu.motoMarca);
  if (presu.motoModelo) altaParams.set("modelo", presu.motoModelo);
  if (presu.motoAnio) altaParams.set("anio", String(presu.motoAnio));
  if (presu.motoPatente) altaParams.set("patente", presu.motoPatente);
  const altaClienteHref = `/clientes/nuevo?${altaParams}`;

  const totales: Record<string, number> = {};
  for (const i of presu.items)
    totales[i.moneda] = (totales[i.moneda] ?? 0) + Number(i.importe);

  const traeLista = (presu.clienteTrae ?? "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl">
      <BackButton fallback="/presupuestos" />
      <PageHeader
        title={`Presupuesto ${numeroPresu(presu.numero)}`}
        description={presu.titulo ?? undefined}
        action={
          <div className="flex flex-wrap gap-2">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <LinkButton href={`/presupuesto/${id}`} variant="outline" size="sm">
              <Printer className="h-4 w-4" />
              PDF
            </LinkButton>
            <LinkButton href={`/presupuestos/${id}/editar`} variant="outline" size="sm">
              <Pencil className="h-4 w-4" />
              Editar
            </LinkButton>
            <DeleteButton
              action={eliminarPresupuesto.bind(null, id)}
              label="Eliminar"
              mensaje="¿Eliminar este presupuesto?"
            />
          </div>
        }
      />

      <div className="space-y-6">
        {/* Estado + acciones */}
        <Card>
          <CardBody className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Estado:</span>
              <Badge className={ESTADO_PRESU_COLOR[presu.estado] ?? "bg-slate-100 text-slate-700 ring-slate-600/20"}>
                {ESTADO_PRESU_LABEL[presu.estado] ?? presu.estado}
              </Badge>
            </div>
            {presu.validezHasta && (
              <span className="text-sm text-slate-500">
                Válido hasta {formatFecha(presu.validezHasta)}
              </span>
            )}
            <div className="ml-auto flex flex-wrap gap-2">
              {presu.estado !== "enviado" && presu.estado !== "aprobado" && (
                <form action={cambiarEstadoPresupuesto.bind(null, id, "enviado")}>
                  <Button type="submit" size="sm" variant="outline">
                    <Send className="h-4 w-4" /> Marcar enviado
                  </Button>
                </form>
              )}
              {presu.estado !== "aprobado" && (
                <form action={cambiarEstadoPresupuesto.bind(null, id, "aprobado")}>
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Aprobado
                  </Button>
                </form>
              )}
              {presu.estado !== "rechazado" && (
                <form action={cambiarEstadoPresupuesto.bind(null, id, "rechazado")}>
                  <Button type="submit" size="sm" variant="outline" className="text-red-600">
                    <XCircle className="h-4 w-4" /> Rechazado
                  </Button>
                </form>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Si está aprobado: agendar turno / crear orden */}
        {presu.estado === "aprobado" && (
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardBody className="flex flex-wrap items-center gap-3">
              {presu.clienteId ? (
                <>
                  <p className="text-sm font-medium text-slate-700">
                    Presupuesto aprobado. Próximos pasos:
                  </p>
                  <div className="ml-auto flex flex-wrap gap-2">
                    <LinkButton
                      href={`/turnos/nuevo?clienteId=${presu.clienteId}${presu.motoId ? `&motoId=${presu.motoId}` : ""}&presupuestoId=${id}`}
                      size="sm"
                    >
                      <CalendarPlus className="h-4 w-4" /> Agendar turno
                    </LinkButton>
                    {presu.ordenes.length === 0 ? (
                      <LinkButton href={`/ordenes/nueva?presupuestoId=${id}`} size="sm" variant="outline">
                        <ClipboardList className="h-4 w-4" /> Crear orden
                      </LinkButton>
                    ) : (
                      <LinkButton href={`/ordenes/${presu.ordenes[0].id}`} size="sm" variant="outline">
                        <ClipboardList className="h-4 w-4" /> Ver orden
                      </LinkButton>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Turnos y órdenes sí necesitan cliente: recién acá se lo da de alta. */}
                  <p className="text-sm font-medium text-slate-700">
                    Presupuesto aprobado. Para agendar turno o crear la orden, primero
                    asignale un cliente.
                  </p>
                  <div className="ml-auto flex flex-wrap gap-2">
                    <LinkButton href={altaClienteHref} size="sm">
                      <UserPlus className="h-4 w-4" /> Dar de alta como cliente
                    </LinkButton>
                    <LinkButton href={`/presupuestos/${id}/editar`} size="sm" variant="outline">
                      <UserCheck className="h-4 w-4" /> Elegir cliente existente
                    </LinkButton>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        )}

        {/* Turnos agendados para este presupuesto */}
        {presu.turnos.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-900">
                {presu.turnos.length === 1 ? "Turno agendado" : "Turnos agendados"}
              </h2>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-slate-100">
                {presu.turnos.map((t) => (
                  <Link
                    key={t.id}
                    href={`/turnos/${t.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50"
                  >
                    <CalendarClock className="h-5 w-5 shrink-0 text-slate-400" />
                    <span className="font-medium text-slate-900">
                      {formatFechaHora(t.fecha)}
                    </span>
                    <Badge className={"ml-auto " + (ESTADO_TURNO_COLOR[t.estado] ?? "bg-slate-100 text-slate-700 ring-slate-600/20")}>
                      {ESTADO_TURNO_LABEL[t.estado] ?? t.estado}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Cliente / moto */}
        <Card>
          <CardBody className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Cliente</p>
              {presu.clienteId ? (
                <Link href={`/clientes/${presu.clienteId}`} className="font-medium text-brand-700 hover:underline">
                  {dest.nombre}
                </Link>
              ) : (
                <p className="font-medium text-slate-900">
                  {dest.nombre}
                  <span className="ml-2 text-xs font-normal text-slate-400">sin registrar</span>
                </p>
              )}
              {dest.telefono && <p className="text-slate-500">{dest.telefono}</p>}
              {!presu.clienteId && (
                <Link
                  href={altaClienteHref}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Dar de alta como cliente
                </Link>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Moto</p>
              <p className="font-medium text-slate-900">
                {moto
                  ? `${moto.marca} ${moto.modelo}${moto.patente ? ` (${moto.patente})` : ""}`
                  : "Sin especificar"}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Servicios incluidos */}
        {presu.servicios.length > 0 && (
          <Card>
            <CardHeader><h2 className="font-semibold text-slate-900">Servicios incluidos</h2></CardHeader>
            <CardBody>
              <ul className="grid gap-x-6 gap-y-1 text-sm text-slate-700 sm:grid-cols-2">
                {presu.servicios.map((s) => (
                  <li key={s.id}>• {s.descripcion}</li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}

        {/* Costos */}
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-900">Costos</h2></CardHeader>
          <CardBody className="p-0">
            {presu.items.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-400">Sin costos cargados.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {presu.items.map((i) => (
                  <div key={i.id} className="flex justify-between px-5 py-2.5 text-sm">
                    <span className="text-slate-800">{i.descripcion}</span>
                    <span className="font-medium text-slate-900">
                      {formatMoneda(Number(i.importe), i.moneda)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {Object.keys(totales).length > 0 && (
              <div className="flex flex-wrap justify-end gap-x-6 border-t border-slate-200 px-5 py-3 text-sm font-bold text-slate-900">
                {Object.entries(totales).map(([m, v]) => (
                  <span key={m}>Total {m}: {formatMoneda(v, m)}</span>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {traeLista.length > 0 && (
          <Card>
            <CardHeader><h2 className="font-semibold text-slate-900">Lo trae el cliente</h2></CardHeader>
            <CardBody>
              <ul className="space-y-1 text-sm text-slate-700">
                {traeLista.map((x, idx) => <li key={idx}>• {x}</li>)}
              </ul>
            </CardBody>
          </Card>
        )}

        {presu.notaFinal?.trim() && (
          <p className="text-sm italic text-slate-500">{presu.notaFinal}</p>
        )}
      </div>
    </div>
  );
}
