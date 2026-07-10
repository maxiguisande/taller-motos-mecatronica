import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Pencil,
  User,
  Bike,
  CalendarClock,
  FileText,
  MessageCircle,
  ClipboardList,
  Ban,
  RotateCcw,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { BackButton } from "@/components/back-button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { formatFechaHora } from "@/lib/format";
import { telefonoWhatsApp } from "@/lib/contacto";
import { linkRecordatorioTurno } from "@/lib/turno";
import { numeroPresu } from "@/lib/presupuesto";
import { ESTADO_TURNO_COLOR, ESTADO_TURNO_LABEL } from "@/lib/constants";
import { eliminarTurno, cambiarEstadoTurno } from "../actions";

export default async function TurnoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const turno = await prisma.turno.findUnique({
    where: { id },
    include: {
      cliente: { include: { contactos: true } },
      moto: true,
      presupuesto: { select: { id: true, numero: true, titulo: true } },
      ordenes: { select: { id: true, numero: true, estado: true }, orderBy: { numero: "desc" } },
    },
  });
  if (!turno) notFound();

  const cancelado = turno.estado === "cancelado";
  // Si el turno generó una orden que ya se completó, no se puede eliminar.
  const tieneOrdenCompletada = turno.ordenes.some((o) => o.estado === "completado");
  const waHref = linkRecordatorioTurno(turno, telefonoWhatsApp(turno.cliente.contactos));

  return (
    <div className="mx-auto max-w-2xl">
      <BackButton fallback="/turnos" />
      <PageHeader
        title="Turno"
        description={formatFechaHora(turno.fecha)}
        action={
          <div className="flex flex-wrap gap-2">
            <LinkButton href={`/turnos/${id}/editar`} variant="outline" size="sm">
              <Pencil className="h-4 w-4" />
              Editar
            </LinkButton>
            {!tieneOrdenCompletada && (
              <DeleteButton
                action={eliminarTurno.bind(null, id)}
                label="Eliminar"
                mensaje="¿Eliminar este turno?"
              />
            )}
          </div>
        }
      />

      <div className="space-y-6">
        {/* Estado + acciones rápidas */}
        <Card>
          <CardBody className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Estado:</span>
              <Badge className={ESTADO_TURNO_COLOR[turno.estado] ?? "bg-slate-100 text-slate-700 ring-slate-600/20"}>
                {ESTADO_TURNO_LABEL[turno.estado] ?? turno.estado}
              </Badge>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              {!cancelado && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <MessageCircle className="h-4 w-4" /> Recordar
                </a>
              )}
              {cancelado ? (
                <form action={cambiarEstadoTurno.bind(null, id, "confirmado")}>
                  <Button type="submit" size="sm" variant="outline">
                    <RotateCcw className="h-4 w-4" /> Reactivar
                  </Button>
                </form>
              ) : (
                <form action={cambiarEstadoTurno.bind(null, id, "cancelado")}>
                  <Button type="submit" size="sm" variant="outline" className="text-red-600">
                    <Ban className="h-4 w-4" /> Cancelar turno
                  </Button>
                </form>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Generar orden */}
        {!cancelado && (
          <Card className="border-brand-200 bg-brand-50/40">
            <CardBody className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium text-slate-700">
                El día del turno, generá la orden de trabajo:
              </p>
              <LinkButton
                href={`/ordenes/nueva?turnoId=${id}`}
                size="sm"
                className="ml-auto"
              >
                <ClipboardList className="h-4 w-4" /> Generar orden
              </LinkButton>
            </CardBody>
          </Card>
        )}

        {/* Datos */}
        <Card>
          <CardBody className="grid gap-4 text-sm sm:grid-cols-2">
            <Dato icon={<User className="h-5 w-5 text-slate-400" />} label="Cliente">
              <Link href={`/clientes/${turno.clienteId}`} className="font-medium text-brand-700 hover:underline">
                {turno.cliente.nombre} {turno.cliente.apellido}
              </Link>
            </Dato>
            <Dato icon={<Bike className="h-5 w-5 text-slate-400" />} label="Moto">
              <span className="font-medium text-slate-900">
                {turno.moto
                  ? `${turno.moto.marca} ${turno.moto.modelo}${turno.moto.patente ? ` (${turno.moto.patente})` : ""}`
                  : "Sin especificar"}
              </span>
            </Dato>
            <Dato icon={<CalendarClock className="h-5 w-5 text-slate-400" />} label="Fecha y hora">
              <span className="font-medium text-slate-900">{formatFechaHora(turno.fecha)}</span>
            </Dato>
            {turno.motivo && (
              <Dato icon={<ClipboardList className="h-5 w-5 text-slate-400" />} label="Motivo">
                <span className="font-medium text-slate-900">{turno.motivo}</span>
              </Dato>
            )}
            {turno.presupuesto && (
              <Dato icon={<FileText className="h-5 w-5 text-slate-400" />} label="Presupuesto">
                <Link href={`/presupuestos/${turno.presupuesto.id}`} className="font-medium text-brand-700 hover:underline">
                  {numeroPresu(turno.presupuesto.numero)}
                  {turno.presupuesto.titulo ? ` · ${turno.presupuesto.titulo}` : ""}
                </Link>
              </Dato>
            )}
          </CardBody>
        </Card>

        {turno.notas && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-900">Notas</h2>
            </CardHeader>
            <CardBody>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{turno.notas}</p>
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
