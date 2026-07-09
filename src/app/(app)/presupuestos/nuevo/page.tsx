import { PageHeader } from "@/components/page-header";
import { PresupuestoForm } from "../presupuesto-form";
import { crearPresupuesto } from "../actions";
import { cargarDatosPresupuesto } from "../data";

export default async function NuevoPresupuestoPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string }>;
}) {
  const { clienteId } = await searchParams;
  const { clientes, servicios, grupos } = await cargarDatosPresupuesto();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Nuevo presupuesto" />
      <PresupuestoForm
        action={crearPresupuesto}
        clientes={clientes}
        servicios={servicios}
        grupos={grupos}
        clienteIdInicial={clienteId}
        submitLabel="Crear presupuesto"
      />
    </div>
  );
}
