import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { GrupoForm } from "../grupo-form";
import { crearGrupo } from "../actions";

export default async function NuevoGrupoPage() {
  const servicios = await prisma.servicio.findMany({
    where: { activo: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nuevo grupo de servicios" />
      <GrupoForm
        action={crearGrupo}
        servicios={servicios}
        submitLabel="Crear grupo"
      />
    </div>
  );
}
