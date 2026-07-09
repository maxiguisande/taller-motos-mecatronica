import { PageHeader } from "@/components/page-header";
import { ClienteForm } from "../cliente-form";
import { crearCliente } from "../actions";

export default async function NuevoClientePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  const volver =
    returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nuevo cliente" description="Cargá los datos de contacto." />
      <ClienteForm
        action={crearCliente}
        submitLabel="Crear cliente"
        returnTo={volver}
        cancelHref={volver ?? "/clientes"}
        conMotos
      />
    </div>
  );
}
