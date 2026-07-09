import { PageHeader } from "@/components/page-header";
import { ProductoForm } from "../producto-form";
import { crearProducto } from "../actions";

export default function NuevoProductoPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nuevo repuesto" />
      <ProductoForm action={crearProducto} submitLabel="Crear repuesto" />
    </div>
  );
}
