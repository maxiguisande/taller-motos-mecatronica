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
  const hoy = new Date();
  const p2 = (n: number) => String(n).padStart(2, "0");
  const minFecha = `${hoy.getFullYear()}-${p2(hoy.getMonth() + 1)}-${p2(hoy.getDate())}T00:00`;
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
        minFecha={minFecha}
        stepFecha={1800}
        submitLabel="Crear turno"
      />
    </div>
  );
}
