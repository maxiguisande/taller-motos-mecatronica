import Link from "next/link";
import { CalendarClock, MessageCircle, ChevronRight, CalendarDays } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SearchBar } from "@/components/search-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { formatFechaHora } from "@/lib/format";
import { telefonoWhatsApp } from "@/lib/contacto";
import { linkRecordatorioTurno } from "@/lib/turno";
import { ESTADO_TURNO_COLOR, ESTADO_TURNO_LABEL } from "@/lib/constants";

type TurnoConRel = Awaited<ReturnType<typeof getTurnos>>[number];

function getTurnos(where: Prisma.TurnoWhereInput) {
  return prisma.turno.findMany({
    where,
    include: { cliente: { include: { contactos: true } }, moto: true },
    orderBy: { fecha: "asc" },
  });
}

function Fila({ t }: { t: TurnoConRel }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
      <Link href={`/turnos/${t.id}`} className="flex min-w-0 flex-1 items-center gap-4">
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
      </Link>
      <Badge className={ESTADO_TURNO_COLOR[t.estado] ?? "bg-slate-100 text-slate-700 ring-slate-600/20"}>
        {ESTADO_TURNO_LABEL[t.estado] ?? t.estado}
      </Badge>
      {t.estado !== "cancelado" && (
        <a
          href={linkRecordatorioTurno(t, telefonoWhatsApp(t.cliente.contactos))}
          target="_blank"
          rel="noopener noreferrer"
          title="Recordar por WhatsApp"
          className="shrink-0 rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
        >
          <MessageCircle className="h-4 w-4" />
        </a>
      )}
      <Link href={`/turnos/${t.id}`} className="shrink-0">
        <ChevronRight className="h-5 w-5 text-slate-300" />
      </Link>
    </div>
  );
}

export default async function TurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = (await searchParams).q?.trim() || "";
  const where: Prisma.TurnoWhereInput = q
    ? {
        OR: [
          { cliente: { nombre: { contains: q, mode: "insensitive" } } },
          { cliente: { apellido: { contains: q, mode: "insensitive" } } },
          { motivo: { contains: q, mode: "insensitive" } },
          { moto: { marca: { contains: q, mode: "insensitive" } } },
          { moto: { modelo: { contains: q, mode: "insensitive" } } },
          { moto: { patente: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};
  const turnos = await getTurnos(where);
  const ahora = new Date();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const proximos = turnos.filter((t) => t.fecha >= inicioHoy);
  const pasados = turnos.filter((t) => t.fecha < inicioHoy).reverse();

  return (
    <div>
      <PageHeader
        title="Turnos"
        description="Agenda de la moto que entra cada día."
        action={
          <div className="flex gap-2">
            <LinkButton href="/turnos/agenda" variant="outline">
              <CalendarDays className="h-4 w-4" /> Agenda
            </LinkButton>
            <LinkButton href="/turnos/nuevo">Nuevo turno</LinkButton>
          </div>
        }
      />

      <div className="mb-4">
        <SearchBar
          action="/turnos"
          defaultValue={q}
          placeholder="Buscar por cliente, moto, patente o motivo…"
        />
      </div>

      {turnos.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="h-6 w-6" />}
          title={q ? "Sin resultados" : "No hay turnos agendados"}
          description={
            q
              ? "Probá con otro término de búsqueda."
              : "Agendá cuándo viene cada cliente con su moto."
          }
          action={!q && <LinkButton href="/turnos/nuevo">Nuevo turno</LinkButton>}
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
