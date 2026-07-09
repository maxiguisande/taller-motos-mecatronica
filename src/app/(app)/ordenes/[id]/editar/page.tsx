import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { OrdenForm } from "../../orden-form";
import { actualizarOrden } from "../../actions";
import { cargarDatosForm } from "../../data";
import { toDateInput } from "@/lib/format";

export default async function EditarOrdenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [orden, datos] = await Promise.all([
    prisma.ordenTrabajo.findUnique({ where: { id }, include: { items: true } }),
    cargarDatosForm(),
  ]);

  if (!orden) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Editar orden" />
      <OrdenForm
        action={actualizarOrden.bind(null, id)}
        clientes={datos.clientes}
        servicios={datos.servicios}
        grupos={datos.grupos}
        productos={datos.productos}
        mecanicos={datos.mecanicos}
        orden={{
          clienteId: orden.clienteId,
          motoId: orden.motoId,
          mecanicoId: orden.mecanicoId,
          fecha: toDateInput(orden.fecha),
          estado: orden.estado,
          kilometraje: orden.kilometraje,
          descuento: Number(orden.descuento),
          estadoPago: orden.estadoPago,
          medioPago: orden.medioPago,
          notas: orden.notas,
          items: orden.items.map((i) => ({
            tipo: i.tipo as "servicio" | "repuesto" | "manual",
            servicioId: i.servicioId,
            productoId: i.productoId,
            descripcion: i.descripcion,
            precio: Number(i.precio),
            cantidad: i.cantidad,
          })),
        }}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
