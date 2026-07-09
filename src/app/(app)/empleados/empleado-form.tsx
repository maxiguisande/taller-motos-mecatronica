"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form";
import { ROLES } from "@/lib/constants";
import { Card, CardBody } from "@/components/ui/card";
import { FormField, Input, Select } from "@/components/ui/field";
import { LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";

type EmpleadoDefaults = {
  nombre?: string;
  email?: string;
  rol?: string;
  activo?: boolean;
};

export function EmpleadoForm({
  action,
  empleado,
  esNuevo = false,
  submitLabel = "Guardar",
}: {
  action: (prev: FormState | undefined, fd: FormData) => Promise<FormState | undefined>;
  empleado?: EmpleadoDefaults;
  esNuevo?: boolean;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const e = state?.fieldErrors ?? {};

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nombre *" htmlFor="nombre" error={e.nombre?.[0]}>
              <Input id="nombre" name="nombre" defaultValue={empleado?.nombre} required />
            </FormField>
            <FormField label="Email *" htmlFor="email" error={e.email?.[0]}>
              <Input id="email" name="email" type="email" defaultValue={empleado?.email} required />
            </FormField>
            <FormField label="Rol" htmlFor="rol">
              <Select id="rol" name="rol" defaultValue={empleado?.rol ?? "empleado"}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </FormField>
            <FormField
              label={esNuevo ? "Contraseña *" : "Nueva contraseña"}
              htmlFor="password"
              error={e.password?.[0]}
            >
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder={esNuevo ? "Mínimo 6 caracteres" : "Dejar en blanco para no cambiar"}
                required={esNuevo}
              />
            </FormField>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="activo"
              defaultChecked={empleado?.activo ?? true}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Activo (puede iniciar sesión)
          </label>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <LinkButton href="/empleados" variant="outline">Cancelar</LinkButton>
            <SubmitButton>{submitLabel}</SubmitButton>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
