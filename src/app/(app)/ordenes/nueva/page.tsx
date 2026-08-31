import { PageHeader } from "@/components/page-header";
import { OrdenForm } from "../orden-form";
import { crearOrden } from "../actions";
import { cargarDatosForm } from "../data";
import { prisma } from "@/lib/prisma";

export default async function NuevaOrdenPage({
  searchParams,
}: {
  searchParams: Promise<{
    clienteId?: string;
    motoId?: string;
    presupuestoId?: string;
    turnoId?: string;
  }>;
}) {
  const sp = await searchParams;
  const { clientes, servicios, grupos, productos, mecanicos } =
    await cargarDatosForm();

  // Prefill: desde un turno (que puede venir de un presupuesto) o directo desde
  // un presupuesto. Copia cliente, moto y los servicios del presupuesto.
  let clienteId = sp.clienteId;
  let motoId = sp.motoId;
  let presupuestoId = sp.presupuestoId;

  if (sp.turnoId) {
    const turno = await prisma.turno.findUnique({
      where: { id: sp.turnoId },
      select: { clienteId: true, motoId: true, presupuestoId: true },
    });
    if (turno) {
      clienteId = clienteId ?? turno.clienteId;
      motoId = motoId ?? turno.motoId ?? undefined;
      presupuestoId = presupuestoId ?? turno.presupuestoId ?? undefined;
    }
  }

  let itemsIniciales: { descripcion: string }[] = [];
  if (presupuestoId) {
    const presu = await prisma.presupuesto.findUnique({
      where: { id: presupuestoId },
      select: {
        clienteId: true,
        motoId: true,
        servicios: { select: { descripcion: true }, orderBy: { id: "asc" } },
      },
    });
    if (presu) {
      clienteId = clienteId ?? presu.clienteId ?? undefined;
      motoId = motoId ?? presu.motoId ?? undefined;
      itemsIniciales = presu.servicios;
    }
  }

  const items = itemsIniciales.map((s) => ({
    tipo: "servicio" as const,
    servicioId: null,
    productoId: null,
    descripcion: s.descripcion,
    precio: 0,
    moneda: "ARS" as const,
    cantidad: 1,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Nueva orden de trabajo" />
      <OrdenForm
        action={crearOrden}
        clientes={clientes}
        servicios={servicios}
        grupos={grupos}
        productos={productos}
        mecanicos={mecanicos}
        clienteIdInicial={clienteId}
        motoIdInicial={motoId}
        presupuestoId={presupuestoId}
        turnoId={sp.turnoId}
        itemsIniciales={items}
        submitLabel="Crear orden"
      />
    </div>
  );
}
