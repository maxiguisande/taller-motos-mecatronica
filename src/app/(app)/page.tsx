import Link from "next/link";
import {
  Users,
  ClipboardList,
  DollarSign,
  ArrowRight,
  Plus,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { formatFecha, formatFechaHora, formatMoneda } from "@/lib/format";
import {
  ESTADO_COLOR,
  ESTADO_LABEL,
  ESTADO_TURNO_COLOR,
  ESTADO_TURNO_LABEL,
} from "@/lib/constants";

export default async function DashboardPage() {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const finHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1);

  const [clientes, ordenesMes, ingresosMes, ultimas, turnos, productos] =
    await Promise.all([
      prisma.cliente.count(),
      prisma.ordenTrabajo.count({ where: { fecha: { gte: inicioMes } } }),
      prisma.ordenTrabajo.aggregate({
        _sum: { total: true },
        where: { fecha: { gte: inicioMes } },
      }),
      prisma.ordenTrabajo.findMany({
        include: { cliente: true, moto: true },
        orderBy: { fecha: "desc" },
        take: 5,
      }),
      prisma.turno.findMany({
        where: {
          fecha: { gte: inicioHoy, lt: finHoy },
          estado: { in: ["pendiente", "confirmado"] },
        },
        include: { cliente: true, moto: true },
        orderBy: { fecha: "asc" },
      }),
      prisma.producto.findMany(),
    ]);

  const stockBajo = productos.filter((p) => p.stock <= p.stockMinimo).length;

  const stats = [
    { label: "Clientes", value: clientes, icon: Users, href: "/clientes", color: "text-brand-700 bg-brand-50" },
    { label: "Servicios del mes", value: ordenesMes, icon: ClipboardList, href: "/ordenes", color: "text-emerald-600 bg-emerald-50" },
    { label: "Ingresos del mes", value: formatMoneda(ingresosMes._sum.total ?? 0), icon: DollarSign, href: "/ordenes", color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div>
      <PageHeader
        title="Inicio"
        description="Resumen del taller."
        action={
          <LinkButton href="/ordenes/nueva">
            <Plus className="h-4 w-4" />
            Nueva orden
          </LinkButton>
        }
      />

      {stockBajo > 0 && (
        <Link
          href="/productos"
          className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800 hover:bg-amber-100"
        >
          <AlertTriangle className="h-4 w-4" />
          {stockBajo} repuesto(s) con stock bajo — revisá el inventario.
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardBody className="flex items-center gap-4">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}>
                  <s.icon className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-500">{s.label}</p>
                  <p className="truncate text-xl font-bold text-slate-900">{s.value}</p>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {/* Turnos de hoy */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <CalendarClock className="h-5 w-5 text-slate-400" /> Turnos de hoy
            </h2>
            <Link href="/turnos" className="text-sm font-medium text-brand-700 hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {turnos.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-400">
                No hay turnos para hoy.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {turnos.map((t) => (
                  <Link
                    key={t.id}
                    href={`/turnos/${t.id}/editar`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">
                        {t.cliente.nombre} {t.cliente.apellido}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {formatFechaHora(t.fecha)}
                        {t.moto ? ` · ${t.moto.marca} ${t.moto.modelo}` : ""}
                        {t.motivo ? ` · ${t.motivo}` : ""}
                      </p>
                    </div>
                    <Badge className={ESTADO_TURNO_COLOR[t.estado] ?? "bg-slate-100 text-slate-700 ring-slate-600/20"}>
                      {ESTADO_TURNO_LABEL[t.estado] ?? t.estado}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Últimas órdenes</h2>
          <Link href="/ordenes" className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {ultimas.length === 0 ? (
          <Card>
            <CardBody className="text-center text-sm text-slate-500">
              Todavía no cargaste ninguna orden.{" "}
              <Link href="/ordenes/nueva" className="text-brand-700 hover:underline">
                Crear la primera
              </Link>.
            </CardBody>
          </Card>
        ) : (
          <Card className="divide-y divide-slate-100">
            {ultimas.map((o) => (
              <Link key={o.id} href={`/ordenes/${o.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50">
                <div className="w-20 shrink-0 text-sm text-slate-500">{formatFecha(o.fecha)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">
                    {o.cliente.nombre} {o.cliente.apellido}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {o.moto ? `${o.moto.marca} ${o.moto.modelo}` : "Sin moto"}
                  </p>
                </div>
                <Badge className={ESTADO_COLOR[o.estado] ?? "bg-slate-100 text-slate-700 ring-slate-600/20"}>
                  {ESTADO_LABEL[o.estado] ?? o.estado}
                </Badge>
                <span className="hidden shrink-0 font-medium text-slate-900 sm:block">
                  {formatMoneda(o.total)}
                </span>
              </Link>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
