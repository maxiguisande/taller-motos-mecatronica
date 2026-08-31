import Link from "next/link";
import { ScrollText, ChevronRight, Bike } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SearchBar } from "@/components/search-bar";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { formatFecha } from "@/lib/format";
import { numeroInforme } from "@/lib/informe";
import { motoPresu } from "@/lib/presupuesto";

/** "Apellido, Nombre" del cliente, o el contacto suelto si no hay cliente registrado. */
function nombreDe(p: {
  cliente: { nombre: string; apellido: string } | null;
  contactoNombre: string | null;
}) {
  return p.cliente ? `${p.cliente.apellido}, ${p.cliente.nombre}` : p.contactoNombre || "Sin cliente";
}

export default async function InformesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = (await searchParams).q?.trim() || "";

  const where: Prisma.InformeWhereInput = q
    ? {
        OR: [
          { titulo: { contains: q, mode: "insensitive" } },
          { cliente: { nombre: { contains: q, mode: "insensitive" } } },
          { cliente: { apellido: { contains: q, mode: "insensitive" } } },
          { contactoNombre: { contains: q, mode: "insensitive" } },
          { contactoTelefono: { contains: q, mode: "insensitive" } },
          { moto: { patente: { contains: q, mode: "insensitive" } } },
          { motoPatente: { contains: q, mode: "insensitive" } },
          ...(/^\d+$/.test(q) ? [{ numero: parseInt(q) }] : []),
        ],
      }
    : {};

  const informes = await prisma.informe.findMany({
    where,
    include: { cliente: true, moto: true },
    orderBy: { numero: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Informes"
        description="Informes de trabajo para entregar al cliente, sin precios."
        action={<LinkButton href="/informes/nuevo">Nuevo informe</LinkButton>}
      />

      <div className="mb-4">
        <SearchBar
          action="/informes"
          defaultValue={q}
          placeholder="Buscar por número, cliente, título o patente…"
        />
      </div>

      {informes.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-6 w-6" />}
          title={q ? "Sin resultados" : "Todavía no hay informes"}
          description={
            q
              ? "Probá con otro término de búsqueda."
              : "Armá un informe de lo que se hizo o se encontró y mandáselo al cliente."
          }
          action={!q && <LinkButton href="/informes/nuevo">Nuevo informe</LinkButton>}
        />
      ) : (
        <Card className="divide-y divide-slate-100">
          {informes.map((p) => {
            const moto = motoPresu(p);
            return (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <Link
                href={`/informes/${p.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <div className="w-16 shrink-0 text-sm font-bold text-slate-400">
                  {numeroInforme(p.numero)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">
                    {p.titulo || nombreDe(p)}
                  </p>
                  <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                    {p.titulo ? `${nombreDe(p)} · ` : ""}
                    {!p.cliente && (
                      <span className="rounded bg-slate-100 px-1 text-[10px] uppercase tracking-wide text-slate-500">
                        sin registrar
                      </span>
                    )}
                    {moto && (
                      <>
                        <Bike className="h-3.5 w-3.5" /> {moto.marca} {moto.modelo}
                      </>
                    )}
                    {` · ${formatFecha(p.createdAt)}`}
                  </p>
                </div>
              </Link>
              <Link href={`/informes/${p.id}`} className="shrink-0">
                <ChevronRight className="h-5 w-5 text-slate-300" />
              </Link>
            </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
