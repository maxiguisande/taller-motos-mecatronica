"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form";
import { Card, CardBody } from "@/components/ui/card";
import { FormField, Input, Textarea } from "@/components/ui/field";
import { LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";

type GrupoDefaults = {
  nombre?: string;
  descripcion?: string | null;
  color?: string;
  servicioIds?: string[];
};

export function GrupoForm({
  action,
  grupo,
  servicios,
  submitLabel = "Guardar",
}: {
  action: (prev: FormState | undefined, fd: FormData) => Promise<FormState | undefined>;
  grupo?: GrupoDefaults;
  servicios: { id: string; nombre: string }[];
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const e = state?.fieldErrors ?? {};
  const seleccionados = new Set(grupo?.servicioIds ?? []);

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <FormField label="Nombre *" htmlFor="nombre" error={e.nombre?.[0]}>
              <Input
                id="nombre"
                name="nombre"
                defaultValue={grupo?.nombre}
                placeholder="Service completo"
                required
              />
            </FormField>
            <FormField label="Color" htmlFor="color" error={e.color?.[0]}>
              <Input
                id="color"
                name="color"
                type="color"
                defaultValue={grupo?.color ?? "#2563eb"}
                className="h-10 w-16 p-1"
              />
            </FormField>
          </div>

          <FormField label="Descripción" htmlFor="descripcion" error={e.descripcion?.[0]}>
            <Textarea
              id="descripcion"
              name="descripcion"
              defaultValue={grupo?.descripcion ?? ""}
              placeholder="Incluye cambio de aceite, filtros, bujías…"
            />
          </FormField>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">
              Servicios incluidos en este grupo
            </p>
            {servicios.length === 0 ? (
              <p className="text-sm text-slate-400">
                No hay servicios cargados todavía.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {servicios.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50"
                  >
                    <input
                      type="checkbox"
                      name="servicioIds"
                      value={s.id}
                      defaultChecked={seleccionados.has(s.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {s.nombre}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <LinkButton href="/grupos" variant="outline">
              Cancelar
            </LinkButton>
            <SubmitButton>{submitLabel}</SubmitButton>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
