import Link from "next/link";
import { FileText, ChevronRight, Bike } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { formatFecha } from "@/lib/format";
import { numeroPresu } from "@/lib/presupuesto";
import { ESTADO_PRESU_COLOR, ESTADO_PRESU_LABEL } from "@/lib/constants";

export default async function PresupuestosPage() {
  const presupuestos = await prisma.presupuesto.findMany({
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

      {presupuestos.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="Todavía no hay presupuestos"
          description="Armá un presupuesto y mandáselo al cliente por WhatsApp."
          action={<LinkButton href="/presupuestos/nuevo">Nuevo presupuesto</LinkButton>}
        />
      ) : (
        <Card className="divide-y divide-slate-100">
          {presupuestos.map((p) => (
            <Link
              key={p.id}
              href={`/presupuestos/${p.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
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
              <Badge
                className={
                  ESTADO_PRESU_COLOR[p.estado] ??
                  "bg-slate-100 text-slate-700 ring-slate-600/20"
                }
              >
                {ESTADO_PRESU_LABEL[p.estado] ?? p.estado}
              </Badge>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
