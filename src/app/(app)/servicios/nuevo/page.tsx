import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ServicioForm } from "../servicio-form";
import { crearServicio } from "../actions";

export default async function NuevoServicioPage() {
  const grupos = await prisma.grupoServicio.findMany({
    select: { id: true, nombre: true, color: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nuevo servicio" />
      <ServicioForm
        action={crearServicio}
        grupos={grupos}
        submitLabel="Crear servicio"
      />
    </div>
  );
}
