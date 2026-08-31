import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { InformeForm } from "../../informe-form";
import { actualizarInforme } from "../../actions";
import { cargarClientesConMotos, cargarServiciosActivos } from "../../data";

export default async function EditarInformePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ clienteId?: string }>;
}) {
  const [{ id }, { clienteId }] = await Promise.all([params, searchParams]);
  const [informe, clientes, servicios] = await Promise.all([
    prisma.informe.findUnique({
      where: { id },
      include: { items: true },
    }),
    cargarClientesConMotos(),
    cargarServiciosActivos(),
  ]);
  if (!informe) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Editar informe" />
      <InformeForm
        action={actualizarInforme.bind(null, id)}
        clientes={clientes}
        servicios={servicios}
        informe={{
          clienteId: informe.clienteId,
          contactoNombre: informe.contactoNombre,
          contactoTelefono: informe.contactoTelefono,
          motoId: informe.motoId,
          motoMarca: informe.motoMarca,
          motoModelo: informe.motoModelo,
          motoAnio: informe.motoAnio,
          motoPatente: informe.motoPatente,
          titulo: informe.titulo,
          notaFinal: informe.notaFinal,
          items: informe.items.map((i) => ({ descripcion: i.descripcion, fotos: i.fotos })),
        }}
        // Al volver de "Crear cliente nuevo", el recién creado queda seleccionado.
        clienteIdInicial={clienteId}
        crearClienteReturnTo={`/informes/${id}/editar`}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
