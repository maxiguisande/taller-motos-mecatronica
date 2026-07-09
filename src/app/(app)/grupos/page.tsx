import Link from "next/link";
import { Layers, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { formatMoneda } from "@/lib/format";
import { eliminarGrupo } from "./actions";

export default async function GruposPage() {
  const grupos = await prisma.grupoServicio.findMany({
    include: {
      servicios: {
        select: { id: true, nombre: true, precio: true },
        orderBy: { nombre: "asc" },
      },
    },
    orderBy: { nombre: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Grupos de servicios"
        description="Agrupá servicios para cargarlos juntos (ej: Service completo)."
        action={<LinkButton href="/grupos/nuevo">Nuevo grupo</LinkButton>}
      />

      {grupos.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-6 w-6" />}
          title="Todavía no hay grupos"
          description="Creá un grupo para juntar varios servicios (aceite + filtros + bujías)."
          action={<LinkButton href="/grupos/nuevo">Nuevo grupo</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grupos.map((g) => {
            const total = g.servicios.reduce(
              (acc, s) => acc + Number(s.precio),
              0,
            );
            return (
              <Card key={g.id}>
                <CardHeader className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: g.color }}
                    />
                    <h2 className="font-semibold text-slate-900">{g.nombre}</h2>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Link
                      href={`/grupos/${g.id}/editar`}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteButton
                      action={eliminarGrupo.bind(null, g.id)}
                      mensaje={`¿Eliminar el grupo "${g.nombre}"? Los servicios no se borran.`}
                    />
                  </div>
                </CardHeader>
                <CardBody>
                  {g.descripcion && (
                    <p className="mb-3 text-sm text-slate-500">{g.descripcion}</p>
                  )}
                  {g.servicios.length === 0 ? (
                    <p className="text-sm text-slate-400">Sin servicios.</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {g.servicios.map((s) => (
                        <li
                          key={s.id}
                          className="flex justify-between gap-2 text-slate-700"
                        >
                          <span>{s.nombre}</span>
                          <span className="text-slate-400">
                            {formatMoneda(s.precio)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {g.servicios.length > 0 && (
                    <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-sm font-medium text-slate-900">
                      <span>Total del grupo</span>
                      <span>{formatMoneda(total)}</span>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
