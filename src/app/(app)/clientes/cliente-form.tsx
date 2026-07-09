"use client";

import { useActionState, useRef, useState } from "react";
import { Plus, Trash2, Star } from "lucide-react";
import type { FormState } from "@/lib/form";
import { TIPOS_CONTACTO } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/card";
import { FormField, Input, Textarea, Select, Label } from "@/components/ui/field";
import { Button, LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";

type Contacto = {
  key: number;
  tipo: string;
  valor: string;
  etiqueta: string;
  principal: boolean;
};

type ClienteDefaults = {
  nombre?: string;
  apellido?: string;
  direccion?: string | null;
  notas?: string | null;
  contactos?: {
    tipo: string;
    valor: string;
    etiqueta?: string | null;
    principal: boolean;
  }[];
};

export function ClienteForm({
  action,
  cliente,
  submitLabel = "Guardar",
  cancelHref = "/clientes",
}: {
  action: (prev: FormState | undefined, fd: FormData) => Promise<FormState | undefined>;
  cliente?: ClienteDefaults;
  submitLabel?: string;
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const e = state?.fieldErrors ?? {};
  const keyRef = useRef(0);
  const nextKey = () => ++keyRef.current;

  const [contactos, setContactos] = useState<Contacto[]>(() =>
    (cliente?.contactos ?? []).map((c) => ({
      key: nextKey(),
      tipo: c.tipo,
      valor: c.valor,
      etiqueta: c.etiqueta ?? "",
      principal: c.principal,
    })),
  );

  function addContacto() {
    setContactos((prev) => [
      ...prev,
      {
        key: nextKey(),
        tipo: "celular",
        valor: "",
        etiqueta: "",
        principal: prev.length === 0,
      },
    ]);
  }
  function updateContacto(key: number, patch: Partial<Contacto>) {
    setContactos((prev) =>
      prev.map((c) => (c.key === key ? { ...c, ...patch } : c)),
    );
  }
  function setPrincipal(key: number) {
    setContactos((prev) =>
      prev.map((c) => ({ ...c, principal: c.key === key })),
    );
  }
  function removeContacto(key: number) {
    setContactos((prev) => prev.filter((c) => c.key !== key));
  }

  const contactosJson = JSON.stringify(
    contactos.map(({ tipo, valor, etiqueta, principal }) => ({
      tipo,
      valor,
      etiqueta,
      principal,
    })),
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="contactosJson" value={contactosJson} />
      <Card>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nombre *" htmlFor="nombre" error={e.nombre?.[0]}>
              <Input id="nombre" name="nombre" defaultValue={cliente?.nombre} required />
            </FormField>
            <FormField label="Apellido *" htmlFor="apellido" error={e.apellido?.[0]}>
              <Input
                id="apellido"
                name="apellido"
                defaultValue={cliente?.apellido}
                required
              />
            </FormField>
          </div>

          {/* Contactos */}
          <div>
            <Label>Contactos</Label>
            <div className="space-y-2">
              {contactos.map((c) => (
                <div
                  key={c.key}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:grid-cols-[9rem_1fr_9rem_auto_auto]"
                >
                  <Select
                    value={c.tipo}
                    onChange={(ev) => updateContacto(c.key, { tipo: ev.target.value })}
                    className="col-span-1"
                  >
                    {TIPOS_CONTACTO.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                  <Input
                    value={c.valor}
                    onChange={(ev) => updateContacto(c.key, { valor: ev.target.value })}
                    placeholder={c.tipo === "email" ? "correo@mail.com" : "Número / usuario"}
                    className="col-span-2 sm:col-span-1"
                  />
                  <Input
                    value={c.etiqueta}
                    onChange={(ev) => updateContacto(c.key, { etiqueta: ev.target.value })}
                    placeholder="Etiqueta"
                    className="hidden sm:block"
                  />
                  <button
                    type="button"
                    onClick={() => setPrincipal(c.key)}
                    title="Marcar como principal"
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      c.principal
                        ? "text-amber-500"
                        : "text-slate-300 hover:text-slate-500",
                    )}
                  >
                    <Star className={cn("h-5 w-5", c.principal && "fill-amber-400")} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeContacto(c.key)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Quitar contacto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addContacto}
              className="mt-2"
            >
              <Plus className="h-4 w-4" />
              Agregar contacto
            </Button>
            <p className="mt-1 text-xs text-slate-400">
              La estrella marca el contacto principal.
            </p>
          </div>

          <FormField label="Dirección" htmlFor="direccion" error={e.direccion?.[0]}>
            <Input
              id="direccion"
              name="direccion"
              defaultValue={cliente?.direccion ?? ""}
            />
          </FormField>

          <FormField label="Notas" htmlFor="notas" error={e.notas?.[0]}>
            <Textarea id="notas" name="notas" defaultValue={cliente?.notas ?? ""} />
          </FormField>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

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
