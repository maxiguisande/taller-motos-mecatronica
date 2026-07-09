import Link from "next/link";
import { Package, Pencil, Plus, Minus, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { formatMoneda } from "@/lib/format";
import { eliminarProducto, ajustarStock } from "./actions";

export default async function ProductosPage() {
  const productos = await prisma.producto.findMany({ orderBy: { nombre: "asc" } });
  const bajos = productos.filter((p) => p.stock <= p.stockMinimo).length;

  return (
    <div>
      <PageHeader
        title="Repuestos"
        description="Insumos y repuestos con control de stock."
        action={<LinkButton href="/productos/nuevo">Nuevo repuesto</LinkButton>}
      />

      {bajos > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          {bajos} repuesto(s) con stock igual o por debajo del mínimo.
        </div>
      )}

      {productos.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Todavía no hay repuestos"
          description="Cargá los repuestos e insumos que vendés (aceite, filtros, pastillas…)."
          action={<LinkButton href="/productos/nuevo">Nuevo repuesto</LinkButton>}
        />
      ) : (
        <Card className="divide-y divide-slate-100">
          {productos.map((p) => {
            const bajo = p.stock <= p.stockMinimo;
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">
                    {p.nombre}
                    {!p.activo && (
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        (inactivo)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{formatMoneda(p.precio)}</p>
                </div>

                {/* Ajuste rápido de stock */}
                <div className="flex items-center gap-1">
                  <form action={ajustarStock.bind(null, p.id, -1)}>
                    <button
                      type="submit"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                      disabled={p.stock <= 0}
                      aria-label="Restar stock"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </form>
                  <Badge
                    className={
                      bajo
                        ? "bg-amber-100 text-amber-800 ring-amber-600/20"
                        : "bg-slate-100 text-slate-700 ring-slate-600/20"
                    }
                  >
                    {p.stock} u.
                  </Badge>
                  <form action={ajustarStock.bind(null, p.id, 1)}>
                    <button
                      type="submit"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                      aria-label="Sumar stock"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </form>
                </div>

                <div className="flex shrink-0 gap-1">
                  <Link
                    href={`/productos/${p.id}/editar`}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton
                    action={eliminarProducto.bind(null, p.id)}
                    mensaje={`¿Eliminar el repuesto "${p.nombre}"?`}
                  />
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
