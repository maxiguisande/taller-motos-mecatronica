"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import type { FormState } from "@/lib/form";
import { Card, CardBody } from "@/components/ui/card";
import { FormField, Input, Textarea } from "@/components/ui/field";
import { Button, LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { crearMoto } from "./actions";

type MotoDefaults = {
  marca?: string;
  modelo?: string;
  anio?: number | null;
  patente?: string | null;
  cilindrada?: number | null;
  color?: string | null;
  numeroChasis?: string | null;
  numeroMotor?: string | null;
  fotoUrl?: string | null;
  kmActual?: number | null;
  proximoServiceKm?: number | null;
  proximoServiceFecha?: string | null; // YYYY-MM-DD
  notas?: string | null;
};

function MotoFields({
  errors,
  moto,
}: {
  errors: Record<string, string[] | undefined>;
  moto?: MotoDefaults;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Marca *" htmlFor="marca" error={errors.marca?.[0]}>
          <Input id="marca" name="marca" defaultValue={moto?.marca} required />
        </FormField>
        <FormField label="Modelo *" htmlFor="modelo" error={errors.modelo?.[0]}>
          <Input id="modelo" name="modelo" defaultValue={moto?.modelo} required />
        </FormField>
        <FormField label="Año" htmlFor="anio" error={errors.anio?.[0]}>
          <Input id="anio" name="anio" type="number" defaultValue={moto?.anio ?? ""} placeholder="2020" />
        </FormField>
        <FormField label="Patente" htmlFor="patente" error={errors.patente?.[0]}>
          <Input id="patente" name="patente" defaultValue={moto?.patente ?? ""} />
        </FormField>
        <FormField label="Cilindrada (cc)" htmlFor="cilindrada" error={errors.cilindrada?.[0]}>
          <Input id="cilindrada" name="cilindrada" type="number" defaultValue={moto?.cilindrada ?? ""} placeholder="150" />
        </FormField>
        <FormField label="Color" htmlFor="color" error={errors.color?.[0]}>
          <Input id="color" name="color" defaultValue={moto?.color ?? ""} />
        </FormField>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <p className="mb-3 text-sm font-medium text-slate-700">Mantenimiento</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Km actual" htmlFor="kmActual" error={errors.kmActual?.[0]}>
            <Input id="kmActual" name="kmActual" type="number" defaultValue={moto?.kmActual ?? ""} placeholder="25000" />
          </FormField>
          <FormField label="Próx. service (km)" htmlFor="proximoServiceKm" error={errors.proximoServiceKm?.[0]}>
            <Input id="proximoServiceKm" name="proximoServiceKm" type="number" defaultValue={moto?.proximoServiceKm ?? ""} placeholder="28000" />
          </FormField>
          <FormField label="Próx. service (fecha)" htmlFor="proximoServiceFecha" error={errors.proximoServiceFecha?.[0]}>
            <Input id="proximoServiceFecha" name="proximoServiceFecha" type="date" defaultValue={moto?.proximoServiceFecha ?? ""} />
          </FormField>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <p className="mb-3 text-sm font-medium text-slate-700">Datos técnicos</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="N° de chasis" htmlFor="numeroChasis" error={errors.numeroChasis?.[0]}>
            <Input id="numeroChasis" name="numeroChasis" defaultValue={moto?.numeroChasis ?? ""} />
          </FormField>
          <FormField label="N° de motor" htmlFor="numeroMotor" error={errors.numeroMotor?.[0]}>
            <Input id="numeroMotor" name="numeroMotor" defaultValue={moto?.numeroMotor ?? ""} />
          </FormField>
          <FormField label="Foto (URL)" htmlFor="fotoUrl" className="sm:col-span-2" error={errors.fotoUrl?.[0]}>
            <Input id="fotoUrl" name="fotoUrl" defaultValue={moto?.fotoUrl ?? ""} placeholder="https://…/foto.jpg" />
          </FormField>
        </div>
      </div>

      <FormField label="Notas" htmlFor="notas" error={errors.notas?.[0]}>
        <Textarea id="notas" name="notas" defaultValue={moto?.notas ?? ""} />
      </FormField>
    </div>
  );
}

/** Form completo (usado en la página de edición de moto). */
export function MotoForm({
  action,
  moto,
  cancelHref,
  submitLabel = "Guardar moto",
}: {
  action: (prev: FormState | undefined, fd: FormData) => Promise<FormState | undefined>;
  moto?: MotoDefaults;
  cancelHref: string;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-4">
          <MotoFields errors={state?.fieldErrors ?? {}} moto={moto} />
          <div className="flex justify-end gap-3 pt-2">
            <LinkButton href={cancelHref} variant="outline">
              Cancelar
            </LinkButton>
            <SubmitButton>{submitLabel}</SubmitButton>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}

/** Botón "Agregar moto" que despliega un form inline. */
export function MotoAdd({ clienteId }: { clienteId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [state, formAction] = useActionState(
    crearMoto.bind(null, clienteId),
    undefined,
  );

  if (!abierto) {
    return (
      <Button variant="outline" size="sm" onClick={() => setAbierto(true)}>
        <Plus className="h-4 w-4" />
        Agregar moto
      </Button>
    );
  }

  return (
    <Card className="border-brand-300">
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-900">Nueva moto</h3>
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form action={formAction} className="space-y-4">
          <MotoFields errors={state?.fieldErrors ?? {}} />
          <div className="flex justify-end">
            <SubmitButton>Guardar moto</SubmitButton>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
