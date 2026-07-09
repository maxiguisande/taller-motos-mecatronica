import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ServicioForm } from "../../servicio-form";
import { actualizarServicio } from "../../actions";

export default async function EditarServicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [servicio, grupos] = await Promise.all([
    prisma.servicio.findUnique({
      where: { id },
      include: { grupos: { select: { id: true } } },
    }),
    prisma.grupoServicio.findMany({
      select: { id: true, nombre: true, color: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  if (!servicio) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Editar servicio" />
      <ServicioForm
        action={actualizarServicio.bind(null, id)}
        grupos={grupos}
        servicio={{
          nombre: servicio.nombre,
          descripcion: servicio.descripcion,
          precio: servicio.precio.toString(),
          duracionMin: servicio.duracionMin,
          activo: servicio.activo,
          grupoIds: servicio.grupos.map((g) => g.id),
        }}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
