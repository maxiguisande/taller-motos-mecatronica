import Link from "next/link";
import { ClipboardList, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SearchBar } from "@/components/search-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { formatFecha, formatMoneda } from "@/lib/format";
import {
  ESTADO_COLOR,
  ESTADO_LABEL,
  ESTADO_PAGO_COLOR,
  ESTADO_PAGO_LABEL,
} from "@/lib/constants";
import type { Prisma } from "@prisma/client";

export default async function OrdenesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where: Prisma.OrdenTrabajoWhereInput = q
    ? {
        cliente: {
          OR: [
            { nombre: { contains: q, mode: "insensitive" } },
            { apellido: { contains: q, mode: "insensitive" } },
          ],
        },
      }
    : {};

  const ordenes = await prisma.ordenTrabajo.findMany({
    where,
    include: {
      cliente: true,
      moto: true,
      _count: { select: { items: true } },
    },
    orderBy: { fecha: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Órdenes de trabajo"
        description="Historial de servicios realizados."
        action={<LinkButton href="/ordenes/nueva">Nueva orden</LinkButton>}
      />

      <div className="mb-4">
        <SearchBar
          action="/ordenes"
          defaultValue={q}
          placeholder="Buscar por cliente…"
        />
      </div>

      {ordenes.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title={q ? "Sin resultados" : "Todavía no hay órdenes"}
          description={
            q
              ? "Probá con otro nombre."
              : "Registrá el primer servicio realizado en el taller."
          }
          action={!q && <LinkButton href="/ordenes/nueva">Nueva orden</LinkButton>}
        />
      ) : (
        <Card className="divide-y divide-slate-100">
          {ordenes.map((o) => (
            <Link
              key={o.id}
              href={`/ordenes/${o.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50"
            >
              <div className="w-24 shrink-0 text-sm font-medium text-slate-900">
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
              <div className="hidden flex-col items-end gap-1 sm:flex">
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
              <span className="hidden w-28 shrink-0 text-right font-medium text-slate-900 sm:block">
                {formatMoneda(o.total)}
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
