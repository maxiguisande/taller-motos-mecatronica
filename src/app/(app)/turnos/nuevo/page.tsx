import { PageHeader } from "@/components/page-header";
import { TurnoForm } from "../turno-form";
import { crearTurno } from "../actions";
import { cargarClientesConMotos } from "../data";

export default async function NuevoTurnoPage() {
  const clientes = await cargarClientesConMotos();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nuevo turno" />
      <TurnoForm action={crearTurno} clientes={clientes} submitLabel="Crear turno" />
    </div>
  );
}
