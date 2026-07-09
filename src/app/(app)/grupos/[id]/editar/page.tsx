import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { GrupoForm } from "../../grupo-form";
import { actualizarGrupo } from "../../actions";

export default async function EditarGrupoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [grupo, servicios] = await Promise.all([
    prisma.grupoServicio.findUnique({
      where: { id },
      include: { servicios: { select: { id: true } } },
    }),
    prisma.servicio.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  if (!grupo) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Editar grupo" />
      <GrupoForm
        action={actualizarGrupo.bind(null, id)}
        servicios={servicios}
        grupo={{
          nombre: grupo.nombre,
          descripcion: grupo.descripcion,
          color: grupo.color,
          servicioIds: grupo.servicios.map((s) => s.id),
        }}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
