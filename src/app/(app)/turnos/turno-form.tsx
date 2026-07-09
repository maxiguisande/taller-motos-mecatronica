"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/lib/form";
import { ESTADOS_TURNO } from "@/lib/constants";
import { Card, CardBody } from "@/components/ui/card";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";

type Cliente = {
  id: string;
  nombre: string;
  apellido: string;
  motos: { id: string; marca: string; modelo: string; patente: string | null }[];
};

type TurnoDefaults = {
  clienteId?: string;
  motoId?: string | null;
  fecha?: string; // YYYY-MM-DDTHH:mm
  motivo?: string | null;
  estado?: string;
  notas?: string | null;
};

export function TurnoForm({
  action,
  clientes,
  turno,
  submitLabel = "Guardar",
}: {
  action: (prev: FormState | undefined, fd: FormData) => Promise<FormState | undefined>;
  clientes: Cliente[];
  turno?: TurnoDefaults;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const e = state?.fieldErrors ?? {};
  const [clienteId, setClienteId] = useState(turno?.clienteId ?? "");
  const [motoId, setMotoId] = useState(turno?.motoId ?? "");
  const clienteActual = clientes.find((c) => c.id === clienteId);

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <FormField label="Cliente *" htmlFor="clienteId" error={e.clienteId?.[0]}>
            <Select
              id="clienteId"
              name="clienteId"
              value={clienteId}
              onChange={(ev) => { setClienteId(ev.target.value); setMotoId(""); }}
              required
            >
              <option value="">Seleccioná un cliente…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Moto" htmlFor="motoId">
            <Select
              id="motoId"
              name="motoId"
              value={motoId}
              onChange={(ev) => setMotoId(ev.target.value)}
              disabled={!clienteActual}
            >
              <option value="">{clienteActual ? "Sin especificar" : "Elegí un cliente primero"}</option>
              {clienteActual?.motos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.marca} {m.modelo}{m.patente ? ` (${m.patente})` : ""}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Fecha y hora *" htmlFor="fecha" error={e.fecha?.[0]}>
            <Input id="fecha" name="fecha" type="datetime-local" defaultValue={turno?.fecha ?? ""} required />
          </FormField>

          <FormField label="Estado" htmlFor="estado">
            <Select id="estado" name="estado" defaultValue={turno?.estado ?? "pendiente"}>
              {ESTADOS_TURNO.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Motivo" htmlFor="motivo" className="sm:col-span-2">
            <Input id="motivo" name="motivo" defaultValue={turno?.motivo ?? ""} placeholder="Ej: Service de 10.000 km" />
          </FormField>

          <FormField label="Notas" htmlFor="notas" className="sm:col-span-2">
            <Textarea id="notas" name="notas" defaultValue={turno?.notas ?? ""} />
          </FormField>

          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <LinkButton href="/turnos" variant="outline">Cancelar</LinkButton>
            <SubmitButton>{submitLabel}</SubmitButton>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
