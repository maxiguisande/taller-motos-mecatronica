import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { EmpleadoForm } from "../../empleado-form";
import { actualizarEmpleado } from "../../actions";

export default async function EditarEmpleadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const empleado = await prisma.user.findUnique({ where: { id } });
  if (!empleado) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Editar empleado" />
      <EmpleadoForm
        action={actualizarEmpleado.bind(null, id)}
        empleado={{
          nombre: empleado.nombre,
          email: empleado.email,
          rol: empleado.rol,
          activo: empleado.activo,
        }}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
