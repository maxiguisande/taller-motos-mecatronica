import Link from "next/link";
import { Users, ChevronRight, Phone, Bike } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SearchBar } from "@/components/search-bar";
import { Pagination } from "@/components/pagination";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const page = Math.max(1, parseInt(sp.page || "1") || 1);

  const where: Prisma.ClienteWhereInput = q
    ? {
        OR: [
          { nombre: { contains: q, mode: "insensitive" } },
          { apellido: { contains: q, mode: "insensitive" } },
          { contactos: { some: { valor: { contains: q, mode: "insensitive" } } } },
          { motos: { some: { patente: { contains: q, mode: "insensitive" } } } },
        ],
      }
    : {};

  const [total, clientes] = await Promise.all([
    prisma.cliente.count({ where }),
    prisma.cliente.findMany({
      where,
      include: {
        contactos: { orderBy: { principal: "desc" }, take: 1 },
        _count: { select: { motos: true, ordenes: true } },
      },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/clientes?${s}` : "/clientes";
  };

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gestioná los clientes del taller y sus motos."
        action={<LinkButton href="/clientes/nuevo">Nuevo cliente</LinkButton>}
      />

      <div className="mb-4">
        <SearchBar
          action="/clientes"
          defaultValue={q}
          placeholder="Buscar por nombre, contacto o patente…"
        />
      </div>

      {clientes.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={q ? "Sin resultados" : "Todavía no hay clientes"}
          description={
            q
              ? "Probá con otro término de búsqueda."
              : "Cargá tu primer cliente para empezar."
          }
          action={!q && <LinkButton href="/clientes/nuevo">Nuevo cliente</LinkButton>}
        />
      ) : (
        <>
        <Card className="divide-y divide-slate-100">
          {clientes.map((c) => (
            <Link
              key={c.id}
              href={`/clientes/${c.id}`}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800">
                {c.nombre[0]}
                {c.apellido[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">
                  {c.apellido}, {c.nombre}
                </p>
                <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {c.contactos[0] && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {c.contactos[0].valor}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Bike className="h-3.5 w-3.5" /> {c._count.motos} moto(s)
                  </span>
                  <span>{c._count.ordenes} servicio(s)</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
            </Link>
          ))}
        </Card>
        <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
        </>
      )}
    </div>
  );
}
