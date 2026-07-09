import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  Pencil,
  Bike,
  ClipboardList,
  Plus,
  Star,
  Gauge,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { formatFecha, formatMoneda } from "@/lib/format";
import {
  ESTADO_COLOR,
  ESTADO_LABEL,
  ESTADO_PAGO_COLOR,
  ESTADO_PAGO_LABEL,
  TIPO_CONTACTO_LABEL,
} from "@/lib/constants";
import { estadoService } from "@/lib/service";
import { eliminarCliente, eliminarMoto } from "../actions";
import { MotoAdd } from "../moto-form";

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      contactos: { orderBy: { principal: "desc" } },
      motos: { orderBy: { createdAt: "asc" } },
      ordenes: {
        include: { moto: true, _count: { select: { items: true } } },
        orderBy: { fecha: "desc" },
      },
    },
  });

  if (!cliente) notFound();

  return (
    <div>
      <PageHeader
        title={`${cliente.nombre} ${cliente.apellido}`}
        action={
          <div className="flex gap-2">
            <LinkButton href={`/clientes/${id}/editar`} variant="outline" size="sm">
              <Pencil className="h-4 w-4" />
              Editar
            </LinkButton>
            <DeleteButton
              action={eliminarCliente.bind(null, id)}
              label="Eliminar"
              mensaje="¿Eliminar este cliente? Se borrarán sus motos y órdenes."
            />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contacto */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Contacto</h2>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            {cliente.contactos.length === 0 ? (
              <p className="text-slate-400">Sin contactos cargados.</p>
            ) : (
              cliente.contactos.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  {c.principal ? (
                    <Star className="mt-0.5 h-4 w-4 shrink-0 fill-amber-400 text-amber-500" />
                  ) : (
                    <span className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-slate-800">{c.valor}</p>
                    <p className="text-xs text-slate-500">
                      {TIPO_CONTACTO_LABEL[c.tipo] ?? c.tipo}
                      {c.etiqueta ? ` · ${c.etiqueta}` : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
            {cliente.direccion && (
              <p className="flex items-center gap-2 border-t border-slate-100 pt-3 text-slate-700">
                <MapPin className="h-4 w-4 text-slate-400" /> {cliente.direccion}
              </p>
            )}
            {cliente.notas && (
              <p className="whitespace-pre-wrap border-t border-slate-100 pt-3 text-slate-600">
                {cliente.notas}
              </p>
            )}
          </CardBody>
        </Card>

        {/* Motos + Historial */}
        <div className="space-y-6 lg:col-span-2">
          {/* Motos */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <Bike className="h-5 w-5 text-slate-400" /> Motos
              </h2>
              <MotoAdd clienteId={id} />
            </div>
            {cliente.motos.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-400">
                Este cliente no tiene motos cargadas.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {cliente.motos.map((m) => {
                  const srv = estadoService(m);
                  return (
                    <Card key={m.id}>
                      <CardBody className="flex gap-3">
                        {m.fotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.fotoUrl}
                            alt={`${m.marca} ${m.modelo}`}
                            className="h-16 w-16 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300">
                            <Bike className="h-7 w-7" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900">
                                {m.marca} {m.modelo}
                              </p>
                              <p className="text-xs text-slate-500">
                                {[m.anio, m.cilindrada && `${m.cilindrada}cc`, m.color]
                                  .filter(Boolean)
                                  .join(" · ") || "—"}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <Link
                                href={`/clientes/${id}/motos/${m.id}/editar`}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                              <DeleteButton
                                action={eliminarMoto.bind(null, m.id, id)}
                                mensaje="¿Eliminar esta moto?"
                              />
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {m.patente && (
                              <Badge className="bg-slate-100 text-slate-700 ring-slate-600/20">
                                {m.patente}
                              </Badge>
                            )}
                            {m.kmActual != null && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Gauge className="h-3.5 w-3.5" />
                                {m.kmActual.toLocaleString("es-AR")} km
                              </span>
                            )}
                          </div>
                          {srv.alerta && (
                            <div
                              className={
                                "mt-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium " +
                                (srv.vencido
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-700")
                              }
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {srv.vencido ? "Service vencido" : "Service próximo"}
                            </div>
                          )}
                          {(m.numeroChasis || m.numeroMotor) && (
                            <p className="mt-2 text-[11px] leading-tight text-slate-400">
                              {m.numeroChasis && <>Chasis: {m.numeroChasis}<br /></>}
                              {m.numeroMotor && <>Motor: {m.numeroMotor}</>}
                            </p>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historial de servicios */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <ClipboardList className="h-5 w-5 text-slate-400" /> Historial de servicios
              </h2>
              <LinkButton
                href={`/ordenes/nueva?clienteId=${id}`}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Nueva orden
              </LinkButton>
            </div>
            {cliente.ordenes.length === 0 ? (
              <EmptyState
                icon={<Wrench className="h-6 w-6" />}
                title="Sin servicios registrados"
                description="Cuando le hagas un servicio a este cliente, va a aparecer acá."
              />
            ) : (
              <Card className="divide-y divide-slate-100">
                {cliente.ordenes.map((o) => (
                  <Link
                    key={o.id}
                    href={`/ordenes/${o.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {formatFecha(o.fecha)}
                        </span>
                        <Badge
                          className={
                            ESTADO_COLOR[o.estado] ??
                            "bg-slate-100 text-slate-700 ring-slate-600/20"
                          }
                        >
                          {ESTADO_LABEL[o.estado] ?? o.estado}
                        </Badge>
                        <Badge
                          className={
                            ESTADO_PAGO_COLOR[o.estadoPago] ??
                            "bg-slate-100 text-slate-700 ring-slate-600/20"
                          }
                        >
                          {ESTADO_PAGO_LABEL[o.estadoPago] ?? o.estadoPago}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {o.moto ? `${o.moto.marca} ${o.moto.modelo}` : "Sin moto"} ·{" "}
                        {o._count.items} ítem(s)
                      </p>
                    </div>
                    <span className="shrink-0 font-medium text-slate-900">
                      {formatMoneda(o.total)}
                    </span>
                  </Link>
                ))}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
