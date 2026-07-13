import { PageHeader } from "@/components/page-header";
import { TurnoForm } from "../turno-form";
import { crearTurno } from "../actions";
import { cargarClientesConMotos } from "../data";

export default async function NuevoTurnoPage({
  searchParams,
}: {
  searchParams: Promise<{
    clienteId?: string;
    motoId?: string;
    presupuestoId?: string;
    fecha?: string;
  }>;
}) {
  const { clienteId, motoId, presupuestoId, fecha } = await searchParams;
  const clientes = await cargarClientesConMotos();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nuevo turno" />
      <TurnoForm
        action={crearTurno}
        clientes={clientes}
        clienteIdInicial={clienteId}
        motoIdInicial={motoId}
        presupuestoId={presupuestoId}
        fechaInicial={fecha}
        submitLabel="Crear turno"
      />
    </div>
  );
}
