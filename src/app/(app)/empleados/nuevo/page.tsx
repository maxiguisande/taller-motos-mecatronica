import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { EmpleadoForm } from "../empleado-form";
import { crearEmpleado } from "../actions";

export default async function NuevoEmpleadoPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nuevo empleado" />
      <EmpleadoForm action={crearEmpleado} esNuevo submitLabel="Crear empleado" />
    </div>
  );
}
