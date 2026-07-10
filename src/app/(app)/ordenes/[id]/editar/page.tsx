import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { BackButton } from "@/components/back-button";
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
    prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        items: {
          include: { fotos: { orderBy: { createdAt: "asc" } } },
          orderBy: { id: "asc" },
        },
        fotos: { orderBy: { createdAt: "asc" } },
      },
    }),
    cargarDatosForm(),
  ]);

  if (!orden) notFound();

  const fotosIngreso = orden.fotos.filter((f) => f.categoria === "ingreso");
  const fotosSalida = orden.fotos.filter((f) => f.categoria === "salida");

  return (
    <div className="mx-auto max-w-3xl">
      <BackButton fallback={`/ordenes/${id}`} />
      <PageHeader title="Editar orden" />
      <OrdenForm
        action={actualizarOrden.bind(null, id)}
        clientes={datos.clientes}
        servicios={datos.servicios}
        grupos={datos.grupos}
        productos={datos.productos}
        mecanicos={datos.mecanicos}
        ordenId={id}
        fotosIngreso={fotosIngreso}
        fotosSalida={fotosSalida}
        orden={{
          clienteId: orden.clienteId,
          motoId: orden.motoId,
          mecanicoId: orden.mecanicoId,
          fecha: toDateInput(orden.fecha),
          estado: orden.estado,
          kilometraje: orden.kilometraje,
          estadoPago: orden.estadoPago,
          medioPago: orden.medioPago,
          notas: orden.notas,
          items: orden.items.map((i) => ({
            id: i.id,
            tipo: i.tipo as "servicio" | "repuesto" | "manual" | "mano_obra",
            servicioId: i.servicioId,
            productoId: i.productoId,
            descripcion: i.descripcion,
            precio: Number(i.precio),
            moneda: i.moneda === "USD" ? "USD" : "ARS",
            cantidad: i.cantidad,
            fotos: i.fotos.map((f) => ({ id: f.id, url: f.url })),
          })),
        }}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
