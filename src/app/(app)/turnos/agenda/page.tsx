import Link from "next/link";
import { ChevronLeft, ChevronRight, List, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { LinkButton } from "@/components/ui/button";
import { ESTADO_TURNO_COLOR } from "@/lib/constants";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Clave YYYY-MM-DD en hora local para agrupar por día. */
function keyDia(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mesStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function AgendaTurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const hoy = new Date();
  let year = hoy.getFullYear();
  let month = hoy.getMonth();
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [y, m] = mes.split("-").map(Number);
    year = y;
    month = m - 1;
  }

  const inicioMes = new Date(year, month, 1);
  const finMes = new Date(year, month + 1, 1);

  const turnos = await prisma.turno.findMany({
    where: { fecha: { gte: inicioMes, lt: finMes } },
    select: {
      id: true,
      fecha: true,
      estado: true,
      cliente: { select: { nombre: true, apellido: true } },
    },
    orderBy: { fecha: "asc" },
  });

  // Agrupar por día.
  const porDia = new Map<string, typeof turnos>();
  for (const t of turnos) {
    const k = keyDia(t.fecha);
    if (!porDia.has(k)) porDia.set(k, []);
    porDia.get(k)!.push(t);
  }

  // Armar la grilla del mes (semanas de lunes a domingo).
  const primerDiaSemana = (inicioMes.getDay() + 6) % 7; // 0 = lunes
  const inicioGrilla = new Date(year, month, 1 - primerDiaSemana);
  const semanas: Date[][] = [];
  const cursor = new Date(inicioGrilla);
  for (let w = 0; w < 6; w++) {
    const semana: Date[] = [];
    for (let d = 0; d < 7; d++) {
      semana.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    semanas.push(semana);
  }
  // Si la última semana es de otro mes entera, la descartamos.
  if (semanas[5].every((d) => d.getMonth() !== month)) semanas.pop();

  const keyHoy = keyDia(hoy);
  const mesLabel = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(inicioMes);
  const prevMes = mesStr(new Date(year, month - 1, 1));
  const nextMes = mesStr(new Date(year, month + 1, 1));

  const hora = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  return (
    <div>
      <PageHeader
        title="Agenda de turnos"
        description="Vista mensual: los turnos de cada día."
        action={
          <div className="flex gap-2">
            <LinkButton href="/turnos" variant="outline" size="sm">
              <List className="h-4 w-4" /> Lista
            </LinkButton>
            <LinkButton href="/turnos/nuevo" size="sm">
              <Plus className="h-4 w-4" /> Nuevo turno
            </LinkButton>
          </div>
        }
      />

      {/* Navegación de mes */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Link
            href={`/turnos/agenda?mes=${prevMes}`}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-200"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <Link
            href={`/turnos/agenda?mes=${nextMes}`}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-200"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
          <h2 className="ml-1 text-lg font-semibold capitalize text-slate-900">
            {mesLabel}
          </h2>
        </div>
        <Link
          href="/turnos/agenda"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          Hoy
        </Link>
      </div>

      {/* Calendario */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* Encabezado de días */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
          {DIAS.map((d) => (
            <div key={d} className="py-2">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{d[0]}</span>
            </div>
          ))}
        </div>

        {/* Semanas */}
        <div className="grid grid-cols-7">
          {semanas.flat().map((dia) => {
            const k = keyDia(dia);
            const delMes = dia.getMonth() === month;
            const esHoy = k === keyHoy;
            const items = porDia.get(k) ?? [];
            return (
              <div
                key={k}
                className={
                  "min-h-[5.5rem] border-b border-r border-slate-100 p-1.5 sm:min-h-28 " +
                  (delMes ? "bg-white" : "bg-slate-50/60")
                }
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold " +
                      (esHoy
                        ? "bg-brand-600 text-white"
                        : delMes
                          ? "text-slate-700"
                          : "text-slate-400")
                    }
                  >
                    {dia.getDate()}
                  </span>
                  {delMes && (
                    <Link
                      href={`/turnos/nuevo?fecha=${k}T09:00`}
                      className="rounded p-0.5 text-slate-300 hover:bg-brand-50 hover:text-brand-600"
                      title="Nuevo turno este día"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>

                {/* Contador en mobile / chips en pantallas grandes */}
                {items.length > 0 && (
                  <>
                    <div className="sm:hidden">
                      <Link
                        href={`/turnos/nuevo?fecha=${k}T09:00`}
                        className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800"
                      >
                        {items.length}
                      </Link>
                    </div>
                    <div className="hidden space-y-1 sm:block">
                      {items.slice(0, 4).map((t) => (
                        <Link
                          key={t.id}
                          href={`/turnos/${t.id}`}
                          className={
                            "block truncate rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset " +
                            (ESTADO_TURNO_COLOR[t.estado] ??
                              "bg-slate-100 text-slate-700 ring-slate-600/20") +
                            (t.estado === "cancelado" ? " line-through opacity-70" : "")
                          }
                          title={`${hora(t.fecha)} · ${t.cliente.apellido}, ${t.cliente.nombre}`}
                        >
                          {hora(t.fecha)} {t.cliente.apellido}
                        </Link>
                      ))}
                      {items.length > 4 && (
                        <p className="px-1 text-[11px] font-medium text-slate-400">
                          +{items.length - 4} más
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
