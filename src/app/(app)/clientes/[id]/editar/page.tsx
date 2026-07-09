import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ClienteForm } from "../../cliente-form";
import { actualizarCliente } from "../../actions";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: { contactos: true },
  });
  if (!cliente) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Editar cliente" />
      <ClienteForm
        action={actualizarCliente.bind(null, id)}
        cliente={cliente}
        submitLabel="Guardar cambios"
        cancelHref={`/clientes/${id}`}
      />
    </div>
  );
}
