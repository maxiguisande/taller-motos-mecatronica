import { PageHeader } from "@/components/page-header";
import { OrdenForm } from "../orden-form";
import { crearOrden } from "../actions";
import { cargarDatosForm } from "../data";

export default async function NuevaOrdenPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string }>;
}) {
  const { clienteId } = await searchParams;
  const { clientes, servicios, grupos, productos, mecanicos } =
    await cargarDatosForm();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Nueva orden de trabajo" />
      <OrdenForm
        action={crearOrden}
        clientes={clientes}
        servicios={servicios}
        grupos={grupos}
        productos={productos}
        mecanicos={mecanicos}
        clienteIdInicial={clienteId}
        submitLabel="Crear orden"
      />
    </div>
  );
}
