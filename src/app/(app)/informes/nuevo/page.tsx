import { PageHeader } from "@/components/page-header";
import { InformeForm } from "../informe-form";
import { crearInforme } from "../actions";
import { cargarClientesConMotos, cargarServiciosActivos } from "../data";

export default async function NuevoInformePage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string }>;
}) {
  const { clienteId } = await searchParams;
  const [clientes, servicios] = await Promise.all([
    cargarClientesConMotos(),
    cargarServiciosActivos(),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Nuevo informe" />
      <InformeForm
        action={crearInforme}
        clientes={clientes}
        servicios={servicios}
        clienteIdInicial={clienteId}
        crearClienteReturnTo="/informes/nuevo"
        submitLabel="Crear informe"
      />
    </div>
  );
}
