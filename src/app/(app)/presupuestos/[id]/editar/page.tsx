import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PresupuestoForm } from "../../presupuesto-form";
import { actualizarPresupuesto } from "../../actions";
import { cargarDatosPresupuesto } from "../../data";
import { toDateInput } from "@/lib/format";

export default async function EditarPresupuestoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [presu, datos] = await Promise.all([
    prisma.presupuesto.findUnique({
      where: { id },
      include: { servicios: true, items: true },
    }),
    cargarDatosPresupuesto(),
  ]);
  if (!presu) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Editar presupuesto" />
      <PresupuestoForm
        action={actualizarPresupuesto.bind(null, id)}
        clientes={datos.clientes}
        servicios={datos.servicios}
        grupos={datos.grupos}
        presupuesto={{
          clienteId: presu.clienteId,
          motoId: presu.motoId,
          titulo: presu.titulo,
          estado: presu.estado,
          validezHasta: presu.validezHasta ? toDateInput(presu.validezHasta) : null,
          clienteTrae: presu.clienteTrae,
          notaFinal: presu.notaFinal,
          servicios: presu.servicios.map((s) => s.descripcion),
          items: presu.items.map((i) => ({
            descripcion: i.descripcion,
            importe: Number(i.importe),
            moneda: i.moneda,
          })),
        }}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
