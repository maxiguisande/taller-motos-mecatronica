import Link from "next/link";
import { ClipboardList, ChevronRight, Bike, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFecha, formatDuracion, formatOrdenNumero } from "@/lib/format";
import { ESTADO_COLOR, ESTADO_LABEL } from "@/lib/constants";

type Orden = Awaited<ReturnType<typeof getOrdenes>>[number];

function getOrdenes(userId: string) {
  return prisma.ordenTrabajo.findMany({
    where: { mecanicoId: userId },
    include: {
      cliente: true,
      moto: true,
      _count: { select: { items: true } },
      items: { where: { realizado: true }, select: { id: true } },
    },
    orderBy: { fecha: "desc" },
  });
}

function Fila({ o }: { o: Orden }) {
  const hechas = o.items.length;
  return (
    <Link href={`/ordenes/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
      <div className="w-12 shrink-0 text-sm font-bold text-slate-400">
        {formatOrdenNumero(o.numero)}
      </div>
      <div className="hidden w-20 shrink-0 text-sm text-slate-500 sm:block">
        {formatFecha(o.fecha)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">
          {o.cliente.nombre} {o.cliente.apellido}
        </p>
        <p className="flex items-center gap-1 truncate text-xs text-slate-500">
          <Bike className="h-3.5 w-3.5" />
          {o.moto ? `${o.moto.marca} ${o.moto.modelo}` : "Sin moto"} ·{" "}
          {hechas}/{o._count.items} tareas
          {o.finalizadoEn ? ` · ${formatDuracion(o.iniciadoEn, o.finalizadoEn)}` : ""}
        </p>
      </div>
      <Badge className={ESTADO_COLOR[o.estado] ?? "bg-slate-100 text-slate-700 ring-slate-600/20"}>
        {ESTADO_LABEL[o.estado] ?? o.estado}
      </Badge>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
    </Link>
  );
}

export default async function MisTareasPage() {
  const user = await currentUser();
  const ordenes = user?.id ? await getOrdenes(user.id) : [];
  const activas = ordenes.filter((o) => o.estado !== "completado");
  const finalizadas = ordenes.filter((o) => o.estado === "completado");

  return (
    <div>
      <PageHeader
        title="Mis tareas"
        description={`Hola ${user?.name ?? ""}, estas son las órdenes asignadas a vos.`}
      />

      {ordenes.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="No tenés tareas asignadas"
          description="Cuando el administrador te asigne una orden, va a aparecer acá."
        />
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Por hacer</h2>
            {activas.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-400">
                No tenés tareas pendientes. ¡Al día! 🎉
              </p>
            ) : (
              <Card className="divide-y divide-slate-100">
                {activas.map((o) => <Fila key={o.id} o={o} />)}
              </Card>
            )}
          </div>

          {finalizadas.length > 0 && (
            <div>
              <h2 className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-brand-600" /> Finalizadas
              </h2>
              <Card className="divide-y divide-slate-100 opacity-80">
                {finalizadas.map((o) => <Fila key={o.id} o={o} />)}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
