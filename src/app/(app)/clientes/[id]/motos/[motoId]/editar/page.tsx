import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { MotoForm } from "../../../../moto-form";
import { actualizarMoto } from "../../../../actions";
import { toDateInput } from "@/lib/format";

export default async function EditarMotoPage({
  params,
}: {
  params: Promise<{ id: string; motoId: string }>;
}) {
  const { id, motoId } = await params;
  const moto = await prisma.moto.findUnique({ where: { id: motoId } });
  if (!moto || moto.clienteId !== id) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Editar moto" />
      <MotoForm
        action={actualizarMoto.bind(null, motoId, id)}
        moto={{
          ...moto,
          proximoServiceFecha: moto.proximoServiceFecha
            ? toDateInput(moto.proximoServiceFecha)
            : null,
        }}
        cancelHref={`/clientes/${id}`}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
