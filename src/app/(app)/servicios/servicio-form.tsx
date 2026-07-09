"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form";
import { Card, CardBody } from "@/components/ui/card";
import { FormField, Input, Textarea } from "@/components/ui/field";
import { LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";

type ServicioDefaults = {
  nombre?: string;
  descripcion?: string | null;
  precio?: number | string;
  duracionMin?: number | null;
  activo?: boolean;
  grupoIds?: string[];
};

export function ServicioForm({
  action,
  servicio,
  grupos,
  submitLabel = "Guardar",
}: {
  action: (prev: FormState | undefined, fd: FormData) => Promise<FormState | undefined>;
  servicio?: ServicioDefaults;
  grupos: { id: string; nombre: string; color: string }[];
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const e = state?.fieldErrors ?? {};
  const seleccionados = new Set(servicio?.grupoIds ?? []);

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-4">
          <FormField label="Nombre *" htmlFor="nombre" error={e.nombre?.[0]}>
            <Input
              id="nombre"
              name="nombre"
              defaultValue={servicio?.nombre}
              placeholder="Cambio de aceite"
              required
            />
          </FormField>

          <FormField label="Descripción" htmlFor="descripcion" error={e.descripcion?.[0]}>
            <Textarea
              id="descripcion"
              name="descripcion"
              defaultValue={servicio?.descripcion ?? ""}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Precio *" htmlFor="precio" error={e.precio?.[0]}>
              <Input
                id="precio"
                name="precio"
                type="number"
                step="0.01"
                min="0"
                defaultValue={servicio?.precio?.toString() ?? "0"}
                required
              />
            </FormField>
            <FormField
              label="Duración estimada (min)"
              htmlFor="duracionMin"
              error={e.duracionMin?.[0]}
            >
              <Input
                id="duracionMin"
                name="duracionMin"
                type="number"
                min="0"
                defaultValue={servicio?.duracionMin ?? ""}
                placeholder="30"
              />
            </FormField>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="activo"
              defaultChecked={servicio?.activo ?? true}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Servicio activo (disponible para cargar en órdenes)
          </label>

          {grupos.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                Grupos a los que pertenece
              </p>
              <div className="flex flex-wrap gap-2">
                {grupos.map((g) => (
                  <label
                    key={g.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50"
                  >
                    <input
                      type="checkbox"
                      name="grupoIds"
                      value={g.id}
                      defaultChecked={seleccionados.has(g.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: g.color }}
                    />
                    {g.nombre}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <LinkButton href="/servicios" variant="outline">
              Cancelar
            </LinkButton>
            <SubmitButton>{submitLabel}</SubmitButton>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
