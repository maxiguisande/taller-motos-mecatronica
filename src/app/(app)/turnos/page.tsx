import Link from "next/link";
import { CalendarClock, Pencil, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { formatFechaHora } from "@/lib/format";
import { ESTADO_TURNO_COLOR, ESTADO_TURNO_LABEL } from "@/lib/constants";
import { eliminarTurno, cambiarEstadoTurno } from "./actions";

type TurnoConRel = Awaited<ReturnType<typeof getTurnos>>[number];

function getTurnos() {
  return prisma.turno.findMany({
    include: { cliente: true, moto: true },
    orderBy: { fecha: "asc" },
  });
}

function Fila({ t }: { t: TurnoConRel }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="w-36 shrink-0 text-sm">
        <p className="font-medium text-slate-900">{formatFechaHora(t.fecha)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">
          {t.cliente.apellido}, {t.cliente.nombre}
        </p>
        <p className="truncate text-xs text-slate-500">
          {t.moto ? `${t.moto.marca} ${t.moto.modelo}` : "Sin moto"}
          {t.motivo ? ` · ${t.motivo}` : ""}
        </p>
      </div>
      <Badge className={ESTADO_TURNO_COLOR[t.estado] ?? "bg-slate-100 text-slate-700 ring-slate-600/20"}>
        {ESTADO_TURNO_LABEL[t.estado] ?? t.estado}
      </Badge>
      <div className="flex shrink-0 items-center gap-1">
        {t.estado !== "realizado" && t.estado !== "cancelado" && (
          <form action={cambiarEstadoTurno.bind(null, t.id, "realizado")}>
            <Button type="submit" variant="ghost" size="icon" className="text-slate-400 hover:text-emerald-600" title="Marcar como realizado">
              <Check className="h-4 w-4" />
            </Button>
          </form>
        )}
        <Link href={`/turnos/${t.id}/editar`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Editar">
          <Pencil className="h-4 w-4" />
        </Link>
        <DeleteButton action={eliminarTurno.bind(null, t.id)} mensaje="¿Eliminar este turno?" />
      </div>
    </div>
  );
}

export default async function TurnosPage() {
  const turnos = await getTurnos();
  const ahora = new Date();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const proximos = turnos.filter((t) => t.fecha >= inicioHoy);
  const pasados = turnos.filter((t) => t.fecha < inicioHoy).reverse();

  return (
    <div>
      <PageHeader
        title="Turnos"
        description="Agenda de la moto que entra cada día."
        action={<LinkButton href="/turnos/nuevo">Nuevo turno</LinkButton>}
      />

      {turnos.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="h-6 w-6" />}
          title="No hay turnos agendados"
          description="Agendá cuándo viene cada cliente con su moto."
          action={<LinkButton href="/turnos/nuevo">Nuevo turno</LinkButton>}
        />
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Próximos</h2>
            {proximos.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-400">
                No hay turnos próximos.
              </p>
            ) : (
              <Card className="divide-y divide-slate-100">
                {proximos.map((t) => (
                  <Fila key={t.id} t={t} />
                ))}
              </Card>
            )}
          </div>

          {pasados.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Anteriores</h2>
              <Card className="divide-y divide-slate-100 opacity-75">
                {pasados.map((t) => (
                  <Fila key={t.id} t={t} />
                ))}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
