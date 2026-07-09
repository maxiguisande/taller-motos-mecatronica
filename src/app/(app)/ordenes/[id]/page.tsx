import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Pencil,
  User,
  Bike,
  Gauge,
  Wrench,
  Package,
  UserCog,
  Play,
  Flag,
  Timer,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { formatFechaLarga, formatFechaHora, formatMoneda, formatDuracion } from "@/lib/format";
import {
  ESTADO_COLOR,
  ESTADO_LABEL,
  ESTADO_PAGO_COLOR,
  ESTADO_PAGO_LABEL,
  MEDIO_PAGO_LABEL,
} from "@/lib/constants";
import { eliminarOrden } from "../actions";
import { iniciarOrden, finalizarOrden, toggleTarea } from "../trabajo-actions";

export default async function OrdenDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [orden, user] = await Promise.all([
    prisma.ordenTrabajo.findUnique({
      where: { id },
      include: { cliente: true, moto: true, mecanico: true, items: true },
    }),
    currentUser(),
  ]);

  if (!orden) notFound();

  const admin = user?.rol === "admin";
  const puedeTrabajar = admin || orden.mecanicoId === user?.id;
  const enCurso = !!orden.iniciadoEn && !orden.finalizadoEn;
  const finalizado = !!orden.finalizadoEn;
  const hechas = orden.items.filter((i) => i.realizado).length;

  const descuento = Number(orden.descuento);
  const subtotal = orden.items.reduce((acc, i) => acc + Number(i.precio) * i.cantidad, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Orden del ${formatFechaLarga(orden.fecha)}`}
        action={
          admin && (
            <div className="flex gap-2">
              <LinkButton href={`/ordenes/${id}/editar`} variant="outline" size="sm">
                <Pencil className="h-4 w-4" />
                Editar
              </LinkButton>
              <DeleteButton
                action={eliminarOrden.bind(null, id)}
                label="Eliminar"
                mensaje="¿Eliminar esta orden? Se repone el stock de los repuestos usados."
              />
            </div>
          )
        }
      />

      <div className="space-y-6">
        <Card>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Dato icon={<User className="h-5 w-5 text-slate-400" />} label="Cliente">
              {admin ? (
                <Link href={`/clientes/${orden.clienteId}`} className="font-medium text-brand-700 hover:underline">
                  {orden.cliente.nombre} {orden.cliente.apellido}
                </Link>
              ) : (
                <span className="font-medium text-slate-900">
                  {orden.cliente.nombre} {orden.cliente.apellido}
                </span>
              )}
            </Dato>
            <Dato icon={<Bike className="h-5 w-5 text-slate-400" />} label="Moto">
              <span className="font-medium text-slate-900">
                {orden.moto
                  ? `${orden.moto.marca} ${orden.moto.modelo}${orden.moto.patente ? ` (${orden.moto.patente})` : ""}`
                  : "Sin especificar"}
              </span>
            </Dato>
            <Dato icon={<UserCog className="h-5 w-5 text-slate-400" />} label="Mecánico">
              <span className="font-medium text-slate-900">{orden.mecanico?.nombre ?? "Sin asignar"}</span>
            </Dato>
            {orden.kilometraje != null && (
              <Dato icon={<Gauge className="h-5 w-5 text-slate-400" />} label="Kilometraje">
                <span className="font-medium text-slate-900">{orden.kilometraje.toLocaleString("es-AR")} km</span>
              </Dato>
            )}
          </CardBody>
        </Card>

        {/* Panel de trabajo */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Trabajo</h2>
            <Badge className={ESTADO_COLOR[orden.estado] ?? "bg-slate-100 text-slate-700 ring-slate-600/20"}>
              {ESTADO_LABEL[orden.estado] ?? orden.estado}
            </Badge>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div>
                <p className="text-xs text-slate-500">Inicio</p>
                <p className="font-medium text-slate-900">
                  {orden.iniciadoEn ? formatFechaHora(orden.iniciadoEn) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Fin</p>
                <p className="font-medium text-slate-900">
                  {orden.finalizadoEn ? formatFechaHora(orden.finalizadoEn) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Duración</p>
                <p className="font-semibold text-slate-900">
                  {finalizado ? formatDuracion(orden.iniciadoEn, orden.finalizadoEn) : enCurso ? "En curso…" : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tareas</p>
                <p className="font-medium text-slate-900">{hechas} / {orden.items.length}</p>
              </div>
            </div>

            {puedeTrabajar && (
              <div className="flex gap-3 border-t border-slate-100 pt-4">
                {!orden.iniciadoEn && (
                  <form action={iniciarOrden.bind(null, id)}>
                    <Button type="submit">
                      <Play className="h-4 w-4" />
                      Empezar
                    </Button>
                  </form>
                )}
                {enCurso && (
                  <form action={finalizarOrden.bind(null, id)}>
                    <Button type="submit">
                      <Flag className="h-4 w-4" />
                      Finalizar
                    </Button>
                  </form>
                )}
                {finalizado && (
                  <form action={iniciarOrden.bind(null, id)}>
                    <Button type="submit" variant="outline">
                      <Timer className="h-4 w-4" />
                      Reabrir
                    </Button>
                  </form>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Tareas / detalle */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">
              {admin ? "Detalle" : "Tareas"}
            </h2>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {orden.items.map((i) => {
                const puedeTildar = puedeTrabajar && enCurso;
                const icono = i.tipo === "repuesto" ? <Package className="h-4 w-4" /> : <Wrench className="h-4 w-4" />;
                return (
                  <div key={i.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {puedeTildar ? (
                        <form action={toggleTarea.bind(null, i.id, id)} className="shrink-0">
                          <button type="submit" title={i.realizado ? "Marcar pendiente" : "Marcar hecha"}>
                            {i.realizado ? (
                              <CheckCircle2 className="h-6 w-6 text-brand-600" />
                            ) : (
                              <Circle className="h-6 w-6 text-slate-300 hover:text-slate-400" />
                            )}
                          </button>
                        </form>
                      ) : i.realizado ? (
                        <CheckCircle2 className="h-6 w-6 shrink-0 text-brand-600" />
                      ) : (
                        <span className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg " + (i.tipo === "repuesto" ? "bg-violet-50 text-violet-600" : "bg-brand-50 text-brand-700")}>
                          {icono}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className={"font-medium " + (i.realizado ? "text-slate-400 line-through" : "text-slate-900")}>
                          {i.descripcion}
                        </p>
                        {i.cantidad > 1 && admin && (
                          <p className="text-xs text-slate-500">{i.cantidad} × {formatMoneda(i.precio)}</p>
                        )}
                        {i.cantidad > 1 && !admin && (
                          <p className="text-xs text-slate-500">Cantidad: {i.cantidad}</p>
                        )}
                      </div>
                    </div>
                    {admin && (
                      <span className="shrink-0 font-medium text-slate-900">
                        {formatMoneda(Number(i.precio) * i.cantidad)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {admin && (
              <div className="space-y-1 border-t border-slate-200 px-5 py-4 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span><span>{formatMoneda(subtotal)}</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Descuento</span><span>− {formatMoneda(descuento)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xl font-bold text-slate-900">
                  <span>Total</span>
                  <span className="flex items-center gap-2">
                    <Badge className={ESTADO_PAGO_COLOR[orden.estadoPago] ?? "bg-slate-100 text-slate-700 ring-slate-600/20"}>
                      {ESTADO_PAGO_LABEL[orden.estadoPago] ?? orden.estadoPago}
                      {orden.medioPago ? ` · ${MEDIO_PAGO_LABEL[orden.medioPago] ?? orden.medioPago}` : ""}
                    </Badge>
                    {formatMoneda(orden.total)}
                  </span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {orden.notas && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-900">Notas</h2>
            </CardHeader>
            <CardBody>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{orden.notas}</p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

function Dato({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        {children}
      </div>
    </div>
  );
}
