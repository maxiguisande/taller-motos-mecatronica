import Link from "next/link";
import { ClipboardList, ChevronRight, Search, X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { formatFecha, formatOrdenNumero } from "@/lib/format";
import { formatTotales } from "@/lib/orden";
import {
  ESTADOS_ORDEN,
  ESTADO_COLOR,
  ESTADO_LABEL,
  ESTADO_PAGO_COLOR,
  ESTADO_PAGO_LABEL,
  ESTADOS_PAGO,
} from "@/lib/constants";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

export default async function OrdenesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    estado?: string;
    estadoPago?: string;
    desde?: string;
    hasta?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const estado = sp.estado || "";
  const estadoPago = sp.estadoPago || "";
  const desde = sp.desde || "";
  const hasta = sp.hasta || "";
  const page = Math.max(1, parseInt(sp.page || "1") || 1);
  const hayFiltros = !!(q || estado || estadoPago || desde || hasta);

  const and: Prisma.OrdenTrabajoWhereInput[] = [];
  if (q) {
    const or: Prisma.OrdenTrabajoWhereInput[] = [
      {
        cliente: {
          OR: [
            { nombre: { contains: q, mode: "insensitive" } },
            { apellido: { contains: q, mode: "insensitive" } },
          ],
        },
      },
    ];
    const asNum = Number(q.replace("#", ""));
    if (Number.isInteger(asNum) && asNum > 0) or.push({ numero: asNum });
    and.push({ OR: or });
  }
  if (estado) and.push({ estado });
  if (estadoPago) and.push({ estadoPago });
  if (desde) and.push({ fecha: { gte: new Date(desde) } });
  if (hasta) {
    const h = new Date(hasta);
    h.setHours(23, 59, 59, 999);
    and.push({ fecha: { lte: h } });
  }
  const where: Prisma.OrdenTrabajoWhereInput = and.length ? { AND: and } : {};

  const [total, ordenes] = await Promise.all([
    prisma.ordenTrabajo.count({ where }),
    prisma.ordenTrabajo.findMany({
      where,
      include: { cliente: true, moto: true, _count: { select: { items: true } } },
      orderBy: { fecha: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (estado) params.set("estado", estado);
    if (estadoPago) params.set("estadoPago", estadoPago);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/ordenes?${s}` : "/ordenes";
  };

  return (
    <div>
      <PageHeader
        title="Órdenes de trabajo"
        description="Historial de servicios realizados."
        action={<LinkButton href="/ordenes/nueva">Nueva orden</LinkButton>}
      />

      {/* Filtros */}
      <form action="/ordenes" className="mb-4 grid items-end gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Cliente o N° de orden…"
            className="pl-9"
          />
        </div>
        <Select name="estado" defaultValue={estado}>
          <option value="">Estado (todos)</option>
          {ESTADOS_ORDEN.map((e) => (
            <option key={e.value} value={e.value}>
              Trabajo: {e.label}
            </option>
          ))}
        </Select>
        <Select name="estadoPago" defaultValue={estadoPago}>
          <option value="">Pago (todos)</option>
          {ESTADOS_PAGO.map((e) => (
            <option key={e.value} value={e.value}>
              Pago: {e.label}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-medium text-slate-500">
            Desde
            <Input name="desde" type="date" defaultValue={desde} className="mt-0.5" />
          </label>
          <label className="block text-xs font-medium text-slate-500">
            Hasta
            <Input name="hasta" type="date" defaultValue={hasta} className="mt-0.5" />
          </label>
        </div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
          <Button type="submit" size="sm">
            <Search className="h-4 w-4" />
            Filtrar
          </Button>
          {hayFiltros && (
            <LinkButton href="/ordenes" variant="ghost" size="sm">
              <X className="h-4 w-4" />
              Limpiar
            </LinkButton>
          )}
          <span className="ml-auto self-center text-sm text-slate-500">
            {total} orden(es)
          </span>
        </div>
      </form>

      {ordenes.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title={hayFiltros ? "Sin resultados" : "Todavía no hay órdenes"}
          description={
            hayFiltros
              ? "Probá cambiando los filtros."
              : "Registrá el primer servicio realizado en el taller."
          }
          action={
            !hayFiltros && <LinkButton href="/ordenes/nueva">Nueva orden</LinkButton>
          }
        />
      ) : (
        <>
          <Card className="divide-y divide-slate-100">
            {ordenes.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
              >
                <Link
                  href={`/ordenes/${o.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="w-14 shrink-0 text-sm font-bold text-slate-400">
                    {formatOrdenNumero(o.numero)}
                  </div>
                  <div className="hidden w-20 shrink-0 text-sm text-slate-600 sm:block">
                    {formatFecha(o.fecha)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {o.cliente.apellido}, {o.cliente.nombre}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {o.moto ? `${o.moto.marca} ${o.moto.modelo}` : "Sin moto"} ·{" "}
                      {o._count.items} ítem(s)
                    </p>
                  </div>
                </Link>
                <div className="hidden flex-col items-end gap-1 sm:flex">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Trabajo
                    </span>
                    <Badge
                      className={
                        ESTADO_COLOR[o.estado] ??
                        "bg-slate-100 text-slate-700 ring-slate-600/20"
                      }
                    >
                      {ESTADO_LABEL[o.estado] ?? o.estado}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Pago
                    </span>
                    <Badge
                      className={
                        ESTADO_PAGO_COLOR[o.estadoPago] ??
                        "bg-slate-100 text-slate-700 ring-slate-600/20"
                      }
                    >
                      {ESTADO_PAGO_LABEL[o.estadoPago] ?? o.estadoPago}
                    </Badge>
                  </div>
                </div>
                <Link
                  href={`/ordenes/${o.id}`}
                  className="hidden w-32 shrink-0 text-right font-medium text-slate-900 sm:block"
                >
                  {formatTotales({ ARS: Number(o.totalArs), USD: Number(o.totalUsd) })}
                </Link>
                <Link href={`/ordenes/${o.id}`} className="shrink-0">
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </Link>
              </div>
            ))}
          </Card>
          <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
        </>
      )}
    </div>
  );
}
