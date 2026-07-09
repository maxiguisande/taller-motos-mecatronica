import Link from "next/link";
import { Wrench, Pencil, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { formatMoneda } from "@/lib/format";
import { eliminarServicio } from "./actions";

export default async function ServiciosPage() {
  const servicios = await prisma.servicio.findMany({
    include: { grupos: { select: { id: true, nombre: true, color: true } } },
    orderBy: { nombre: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Servicios"
        description="Catálogo de servicios que ofrece el taller."
        action={<LinkButton href="/servicios/nuevo">Nuevo servicio</LinkButton>}
      />

      {servicios.length === 0 ? (
        <EmptyState
          icon={<Wrench className="h-6 w-6" />}
          title="Todavía no hay servicios"
          description="Cargá los servicios que ofrece el taller (cambio de aceite, frenos, etc.)."
          action={<LinkButton href="/servicios/nuevo">Nuevo servicio</LinkButton>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {servicios.map((s) => (
            <Card key={s.id} className={s.activo ? "" : "opacity-60"}>
              <CardBody className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{s.nombre}</p>
                    {s.descripcion && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                        {s.descripcion}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Link
                      href={`/servicios/${s.id}/editar`}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteButton
                      action={eliminarServicio.bind(null, s.id)}
                      mensaje={`¿Eliminar el servicio "${s.nombre}"?`}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <span className="text-lg font-semibold text-slate-900">
                    {formatMoneda(s.precio)}
                  </span>
                  {s.duracionMin ? (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" /> {s.duracionMin} min
                    </span>
                  ) : null}
                  {!s.activo && (
                    <Badge className="bg-slate-100 text-slate-600 ring-slate-600/20">
                      Inactivo
                    </Badge>
                  )}
                </div>

                {s.grupos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                    {s.grupos.map((g) => (
                      <span
                        key={g.id}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: g.color }}
                        />
                        {g.nombre}
                      </span>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
