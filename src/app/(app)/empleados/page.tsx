import Link from "next/link";
import { UserCog, Pencil, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { eliminarEmpleado } from "./actions";

export default async function EmpleadosPage() {
  const admin = await requireAdmin();
  const empleados = await prisma.user.findMany({
    include: {
      _count: {
        select: { ordenes: { where: { estado: { not: "completado" } } } },
      },
    },
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Empleados"
        description="Personal del taller y sus accesos."
        action={<LinkButton href="/empleados/nuevo">Nuevo empleado</LinkButton>}
      />

      <Card className="divide-y divide-slate-100">
        {empleados.map((u) => (
          <div key={u.id} className="flex items-center gap-4 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-carbon-800 font-semibold text-white">
              {u.nombre.split(" ").map((s) => s[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900">
                {u.nombre}
                {!u.activo && (
                  <span className="ml-2 text-xs font-normal text-slate-400">(inactivo)</span>
                )}
              </p>
              <p className="truncate text-xs text-slate-500">{u.email}</p>
            </div>
            <span className="hidden text-xs text-slate-500 sm:block">
              {u._count.ordenes} tarea(s) abierta(s)
            </span>
            {u.rol === "admin" ? (
              <Badge className="bg-brand-100 text-brand-800 ring-brand-600/20">
                <ShieldCheck className="mr-1 h-3 w-3" /> SuperUser
              </Badge>
            ) : (
              <Badge className="bg-slate-100 text-slate-700 ring-slate-600/20">Mecánico</Badge>
            )}
            <div className="flex shrink-0 gap-1">
              <Link
                href={`/empleados/${u.id}/editar`}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              {u.id !== admin.id && (
                <DeleteButton
                  action={eliminarEmpleado.bind(null, u.id)}
                  mensaje={`¿Eliminar a ${u.nombre}? Sus órdenes quedan sin asignar.`}
                />
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
