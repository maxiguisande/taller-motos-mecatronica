"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form";
import { Card, CardBody } from "@/components/ui/card";
import { FormField, Input, Textarea } from "@/components/ui/field";
import { LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";

type ProductoDefaults = {
  nombre?: string;
  descripcion?: string | null;
  precio?: number | string;
  costo?: number | string | null;
  stock?: number;
  stockMinimo?: number;
  activo?: boolean;
};

export function ProductoForm({
  action,
  producto,
  submitLabel = "Guardar",
}: {
  action: (prev: FormState | undefined, fd: FormData) => Promise<FormState | undefined>;
  producto?: ProductoDefaults;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const e = state?.fieldErrors ?? {};

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-4">
          <FormField label="Nombre *" htmlFor="nombre" error={e.nombre?.[0]}>
            <Input
              id="nombre"
              name="nombre"
              defaultValue={producto?.nombre}
              placeholder="Aceite 10W40 (litro)"
              required
            />
          </FormField>

          <FormField label="Descripción" htmlFor="descripcion" error={e.descripcion?.[0]}>
            <Textarea
              id="descripcion"
              name="descripcion"
              defaultValue={producto?.descripcion ?? ""}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Precio de venta *" htmlFor="precio" error={e.precio?.[0]}>
              <Input
                id="precio"
                name="precio"
                type="number"
                step="0.01"
                min="0"
                defaultValue={producto?.precio?.toString() ?? "0"}
                required
              />
            </FormField>
            <FormField label="Costo de compra" htmlFor="costo" error={e.costo?.[0]}>
              <Input
                id="costo"
                name="costo"
                type="number"
                step="0.01"
                min="0"
                defaultValue={producto?.costo?.toString() ?? ""}
              />
            </FormField>
            <FormField label="Stock actual" htmlFor="stock" error={e.stock?.[0]}>
              <Input
                id="stock"
                name="stock"
                type="number"
                defaultValue={producto?.stock ?? 0}
              />
            </FormField>
            <FormField label="Stock mínimo (alerta)" htmlFor="stockMinimo" error={e.stockMinimo?.[0]}>
              <Input
                id="stockMinimo"
                name="stockMinimo"
                type="number"
                min="0"
                defaultValue={producto?.stockMinimo ?? 0}
              />
            </FormField>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="activo"
              defaultChecked={producto?.activo ?? true}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Producto activo (disponible para cargar en órdenes)
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <LinkButton href="/productos" variant="outline">
              Cancelar
            </LinkButton>
            <SubmitButton>{submitLabel}</SubmitButton>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
