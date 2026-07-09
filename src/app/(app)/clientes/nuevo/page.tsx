import { PageHeader } from "@/components/page-header";
import { ClienteForm } from "../cliente-form";
import { crearCliente } from "../actions";

export default function NuevoClientePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nuevo cliente" description="Cargá los datos de contacto." />
      <ClienteForm action={crearCliente} submitLabel="Crear cliente" />
    </div>
  );
}
