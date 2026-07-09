import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { TurnoForm } from "../../turno-form";
import { actualizarTurno } from "../../actions";
import { cargarClientesConMotos } from "../../data";
import { toDateTimeInput } from "@/lib/format";

export default async function EditarTurnoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [turno, clientes] = await Promise.all([
    prisma.turno.findUnique({ where: { id } }),
    cargarClientesConMotos(),
  ]);
  if (!turno) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Editar turno" />
      <TurnoForm
        action={actualizarTurno.bind(null, id)}
        clientes={clientes}
        turno={{
          clienteId: turno.clienteId,
          motoId: turno.motoId,
          fecha: toDateTimeInput(turno.fecha),
          motivo: turno.motivo,
          estado: turno.estado,
          notas: turno.notas,
        }}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
