import Link from "next/link";
import { FileText, ChevronRight, Bike } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SearchBar } from "@/components/search-bar";
import { EstadoQuickSelect } from "@/components/estado-quick-select";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { formatFecha } from "@/lib/format";
import { numeroPresu } from "@/lib/presupuesto";
import { ESTADOS_PRESUPUESTO } from "@/lib/constants";
import { vencerPresupuestosVencidos } from "./data";
import { cambiarEstadoPresupuestoLista } from "./actions";

export default async function PresupuestosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await vencerPresupuestosVencidos();
  const q = (await searchParams).q?.trim() || "";

  const where: Prisma.PresupuestoWhereInput = q
    ? {
        OR: [
          { titulo: { contains: q, mode: "insensitive" } },
          { cliente: { nombre: { contains: q, mode: "insensitive" } } },
          { cliente: { apellido: { contains: q, mode: "insensitive" } } },
          { moto: { patente: { contains: q, mode: "insensitive" } } },
          ...(/^\d+$/.test(q) ? [{ numero: parseInt(q) }] : []),
        ],
      }
    : {};

  const presupuestos = await prisma.presupuesto.findMany({
    where,
    include: { cliente: true, moto: true },
    orderBy: { numero: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Presupuestos"
        description="Cotizaciones para enviar al cliente."
        action={<LinkButton href="/presupuestos/nuevo">Nuevo presupuesto</LinkButton>}
      />

      <div className="mb-4">
        <SearchBar
          action="/presupuestos"
          defaultValue={q}
          placeholder="Buscar por número, cliente, título o patente…"
        />
      </div>

      {presupuestos.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title={q ? "Sin resultados" : "Todavía no hay presupuestos"}
          description={
            q
              ? "Probá con otro término de búsqueda."
              : "Armá un presupuesto y mandáselo al cliente por WhatsApp."
          }
          action={!q && <LinkButton href="/presupuestos/nuevo">Nuevo presupuesto</LinkButton>}
        />
      ) : (
        <Card className="divide-y divide-slate-100">
          {presupuestos.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <Link
                href={`/presupuestos/${p.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <div className="w-16 shrink-0 text-sm font-bold text-slate-400">
                  {numeroPresu(p.numero)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">
                    {p.titulo || `${p.cliente.apellido}, ${p.cliente.nombre}`}
                  </p>
                  <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                    {p.titulo ? `${p.cliente.apellido}, ${p.cliente.nombre} · ` : ""}
                    {p.moto && (
                      <>
                        <Bike className="h-3.5 w-3.5" /> {p.moto.marca} {p.moto.modelo}
                      </>
                    )}
                    {p.validezHasta ? ` · vence ${formatFecha(p.validezHasta)}` : ""}
                  </p>
                </div>
              </Link>
              <EstadoQuickSelect
                estados={ESTADOS_PRESUPUESTO}
                value={p.estado}
                action={cambiarEstadoPresupuestoLista.bind(null, p.id)}
              />
              <Link href={`/presupuestos/${p.id}`} className="shrink-0">
                <ChevronRight className="h-5 w-5 text-slate-300" />
              </Link>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
