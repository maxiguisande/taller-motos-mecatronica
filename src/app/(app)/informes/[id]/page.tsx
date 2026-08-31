import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, MessageCircle, Printer, UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { BackButton } from "@/components/back-button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { FotosItem } from "@/components/fotos-item";
import { formatFechaHora } from "@/lib/format";
import { numeroInforme, linkWhatsAppInforme } from "@/lib/informe";
import { destinatarioPresu, motoPresu } from "@/lib/presupuesto";
import { eliminarInforme } from "../actions";

export default async function InformeDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const informe = await prisma.informe.findUnique({
    where: { id },
    include: {
      cliente: { include: { contactos: true } },
      moto: true,
      items: true,
    },
  });
  if (!informe) notFound();

  // Cliente registrado o contacto suelto (mismo criterio que presupuestos).
  const dest = destinatarioPresu(informe);
  // Moto del cliente o la anotada a mano.
  const moto = motoPresu(informe);
  const waHref = linkWhatsAppInforme(
    {
      numero: informe.numero,
      titulo: informe.titulo,
      fecha: informe.createdAt,
      moto,
      items: informe.items,
      notaFinal: informe.notaFinal,
    },
    dest.telefono,
  );
  // Para dar de alta al contacto suelto como cliente y volver acá con él ya elegido.
  const altaParams = new URLSearchParams({ returnTo: `/informes/${id}/editar` });
  if (informe.contactoNombre) altaParams.set("nombre", informe.contactoNombre);
  if (informe.contactoTelefono) altaParams.set("telefono", informe.contactoTelefono);
  if (informe.motoMarca) altaParams.set("marca", informe.motoMarca);
  if (informe.motoModelo) altaParams.set("modelo", informe.motoModelo);
  if (informe.motoAnio) altaParams.set("anio", String(informe.motoAnio));
  if (informe.motoPatente) altaParams.set("patente", informe.motoPatente);
  const altaClienteHref = `/clientes/nuevo?${altaParams}`;

  return (
    <div className="mx-auto max-w-3xl">
      <BackButton fallback="/informes" />
      <PageHeader
        title={`Informe ${numeroInforme(informe.numero)}`}
        description={informe.titulo ?? undefined}
        action={
          <div className="flex flex-wrap gap-2">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <LinkButton href={`/informe/${id}`} variant="outline" size="sm">
              <Printer className="h-4 w-4" />
              PDF
            </LinkButton>
            <LinkButton href={`/informes/${id}/editar`} variant="outline" size="sm">
              <Pencil className="h-4 w-4" />
              Editar
            </LinkButton>
            <DeleteButton
              action={eliminarInforme.bind(null, id)}
              label="Eliminar"
              mensaje="¿Eliminar este informe?"
            />
          </div>
        }
      />

      <div className="space-y-6">
        {/* Cliente / moto / fecha */}
        <Card>
          <CardBody className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Cliente</p>
              {informe.clienteId ? (
                <Link href={`/clientes/${informe.clienteId}`} className="font-medium text-brand-700 hover:underline">
                  {dest.nombre}
                </Link>
              ) : (
                <p className="font-medium text-slate-900">
                  {dest.nombre}
                  <span className="ml-2 text-xs font-normal text-slate-400">sin registrar</span>
                </p>
              )}
              {dest.telefono && <p className="text-slate-500">{dest.telefono}</p>}
              {!informe.clienteId && (
                <Link
                  href={altaClienteHref}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Dar de alta como cliente
                </Link>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Moto</p>
              <p className="font-medium text-slate-900">
                {moto
                  ? `${moto.marca} ${moto.modelo}${moto.patente ? ` (${moto.patente})` : ""}`
                  : "Sin especificar"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Fecha</p>
              <p className="font-medium text-slate-900">{formatFechaHora(informe.createdAt)}</p>
            </div>
          </CardBody>
        </Card>

        {/* Ítems */}
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-900">Ítems del informe</h2></CardHeader>
          <CardBody>
            {informe.items.length === 0 ? (
              <p className="text-sm text-slate-400">Sin ítems cargados.</p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-700">
                {informe.items.map((i) => (
                  <li key={i.id}>
                    • {i.descripcion}
                    {i.fotos.length > 0 && (
                      <div className="pl-3">
                        {/* Reusa el visor de fotos de las órdenes, en modo solo lectura. */}
                        <FotosItem
                          uploadFields={{}}
                          fotos={i.fotos.map((url) => ({ id: url, url }))}
                          editable={false}
                          deletable={false}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {informe.notaFinal?.trim() && (
          <p className="text-sm italic text-slate-500">{informe.notaFinal}</p>
        )}
      </div>
    </div>
  );
}
