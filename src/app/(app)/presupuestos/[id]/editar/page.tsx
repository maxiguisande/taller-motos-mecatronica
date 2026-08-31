import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PresupuestoForm } from "../../presupuesto-form";
import { actualizarPresupuesto } from "../../actions";
import { cargarDatosPresupuesto } from "../../data";
import { toDateInput } from "@/lib/format";

export default async function EditarPresupuestoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ clienteId?: string }>;
}) {
  const [{ id }, { clienteId }] = await Promise.all([params, searchParams]);
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
          contactoNombre: presu.contactoNombre,
          contactoTelefono: presu.contactoTelefono,
          motoId: presu.motoId,
          motoMarca: presu.motoMarca,
          motoModelo: presu.motoModelo,
          motoAnio: presu.motoAnio,
          motoPatente: presu.motoPatente,
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
        // Al volver de "Crear cliente nuevo", el recién creado queda seleccionado.
        clienteIdInicial={clienteId}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
