"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import type { FormState } from "@/lib/form";
import { ESTADOS_TURNO } from "@/lib/constants";
import { Card, CardBody } from "@/components/ui/card";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { UnsavedGuard } from "@/components/unsaved-guard";

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
  clienteIdInicial,
  motoIdInicial,
  presupuestoId,
  submitLabel = "Guardar",
}: {
  action: (prev: FormState | undefined, fd: FormData) => Promise<FormState | undefined>;
  clientes: Cliente[];
  turno?: TurnoDefaults;
  clienteIdInicial?: string;
  motoIdInicial?: string;
  presupuestoId?: string;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const e = state?.fieldErrors ?? {};
  const [dirty, setDirty] = useState(false);
  const [clienteId, setClienteId] = useState(turno?.clienteId ?? clienteIdInicial ?? "");
  const [motoId, setMotoId] = useState(turno?.motoId ?? motoIdInicial ?? "");
  const clienteActual = clientes.find((c) => c.id === clienteId);
  // Si el turno viene de un presupuesto, el cliente y la moto quedan fijos.
  const bloqueado = !!presupuestoId;

  return (
    <form action={formAction} onChange={() => setDirty(true)} onSubmit={() => setDirty(false)}>
      <UnsavedGuard active={dirty} />
      {presupuestoId && (
        <>
          <input type="hidden" name="presupuestoId" value={presupuestoId} />
          <input type="hidden" name="clienteId" value={clienteId} />
          <input type="hidden" name="motoId" value={motoId} />
        </>
      )}
      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <FormField label="Cliente *" htmlFor="clienteId" error={e.clienteId?.[0]}>
            <Select
              id="clienteId"
              name="clienteId"
              value={clienteId}
              onChange={(ev) => { setClienteId(ev.target.value); setMotoId(""); }}
              required
              disabled={bloqueado}
            >
              <option value="">Seleccioná un cliente…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>
              ))}
            </Select>
            {bloqueado ? (
              <p className="mt-1.5 text-xs text-slate-400">Definido por el presupuesto.</p>
            ) : (
              <Link
                href="/clientes/nuevo?returnTo=/turnos/nuevo"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Crear cliente nuevo
              </Link>
            )}
          </FormField>

          <FormField label="Moto" htmlFor="motoId">
            <Select
              id="motoId"
              name="motoId"
              value={motoId}
              onChange={(ev) => setMotoId(ev.target.value)}
              disabled={bloqueado || !clienteActual}
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
