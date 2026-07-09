import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ProductoForm } from "../../producto-form";
import { actualizarProducto } from "../../actions";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const producto = await prisma.producto.findUnique({ where: { id } });
  if (!producto) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Editar repuesto" />
      <ProductoForm
        action={actualizarProducto.bind(null, id)}
        producto={{
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio.toString(),
          costo: producto.costo?.toString() ?? "",
          stock: producto.stock,
          stockMinimo: producto.stockMinimo,
          activo: producto.activo,
        }}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
