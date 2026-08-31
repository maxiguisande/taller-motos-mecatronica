import { PageHeader } from "@/components/page-header";
import { ClienteForm } from "../cliente-form";
import { crearCliente } from "../actions";

export default async function NuevoClientePage({
  searchParams,
}: {
  searchParams: Promise<{
    returnTo?: string;
    nombre?: string;
    telefono?: string;
    marca?: string;
    modelo?: string;
    anio?: string;
    patente?: string;
  }>;
}) {
  const { returnTo, nombre, telefono, marca, modelo, anio, patente } = await searchParams;
  const volver =
    returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : undefined;

  // Prefill al dar de alta a alguien que ya pidió un presupuesto sin ser
  // cliente: "Juan Pérez" -> nombre "Juan", apellido "Pérez"; el teléfono
  // entra como contacto y la moto anotada a mano como moto inicial.
  const partes = (nombre ?? "").trim().split(/\s+/).filter(Boolean);
  const motos =
    marca || modelo || anio || patente
      ? [{ marca: marca ?? "", modelo: modelo ?? "", anio: anio ?? "", patente: patente ?? "" }]
      : undefined;
  const inicial =
    partes.length || telefono || motos
      ? {
          nombre: partes[0],
          apellido: partes.slice(1).join(" "),
          contactos: telefono ? [{ tipo: "celular", valor: telefono, principal: true }] : [],
          motos,
        }
      : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nuevo cliente" description="Cargá los datos de contacto." />
      <ClienteForm
        action={crearCliente}
        cliente={inicial}
        submitLabel="Crear cliente"
        returnTo={volver}
        cancelHref={volver ?? "/clientes"}
        conMotos
      />
    </div>
  );
}
