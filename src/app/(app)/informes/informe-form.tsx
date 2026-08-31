"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Loader2, Plus, Trash2, UserPlus, X } from "lucide-react";
import type { FormState } from "@/lib/form";
import { comprimir } from "@/lib/imagen";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { Button, LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { UnsavedGuard } from "@/components/unsaved-guard";

type Cliente = {
  id: string;
  nombre: string;
  apellido: string;
  motos: { id: string; marca: string; modelo: string; patente: string | null }[];
};

type Servicio = { id: string; nombre: string };

type Item = { key: number; descripcion: string; fotos: string[] };

type InformeDefaults = {
  clienteId: string | null;
  contactoNombre: string | null;
  contactoTelefono: string | null;
  motoId: string | null;
  motoMarca: string | null;
  motoModelo: string | null;
  motoAnio: number | null;
  motoPatente: string | null;
  titulo: string | null;
  notaFinal: string | null;
  items: { descripcion: string; fotos: string[] }[];
};

const MAX_FOTOS = 3;

// Contador a nivel módulo para las keys de la lista (evita leer refs en el render).
let seq = 0;
const nextKey = () => ++seq;

/** Miniaturas + cámara para las fotos de una línea del informe (máx 3). */
function FotosLinea({
  fotos,
  onChange,
}: {
  fotos: string[];
  onChange: (fotos: string[]) => void;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setSubiendo(true);
    try {
      const blob = await comprimir(file);
      const fd = new FormData();
      fd.append("file", blob, "foto.jpg");
      const res = await fetch("/api/fotos-informe", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "No se pudo subir la foto");
      } else {
        const { url } = (await res.json()) as { url: string };
        onChange([...fotos, url]);
      }
    } catch {
      setError("No se pudo procesar la imagen");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {fotos.map((url) => (
        <div key={url} className="relative">
          <a href={url} target="_blank" rel="noopener noreferrer" title="Ver foto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Foto del ítem"
              className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
            />
          </a>
          <button
            type="button"
            onClick={() => onChange(fotos.filter((u) => u !== url))}
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow"
            aria-label="Quitar foto"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {fotos.length < MAX_FOTOS && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          title="Hasta 3 fotos por ítem"
          className="flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-brand-400 hover:text-brand-600 disabled:opacity-50"
        >
          {subiendo ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          <span className="text-[10px]">{fotos.length}/{MAX_FOTOS}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        className="hidden"
      />
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function InformeForm({
  action,
  clientes,
  servicios,
  informe,
  clienteIdInicial,
  crearClienteReturnTo,
  submitLabel = "Guardar",
}: {
  action: (prev: FormState | undefined, fd: FormData) => Promise<FormState | undefined>;
  clientes: Cliente[];
  servicios: Servicio[];
  informe?: InformeDefaults;
  clienteIdInicial?: string;
  /** Adónde vuelve el link de crear cliente, con el nuevo cliente ya seleccionado. */
  crearClienteReturnTo: string;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const e = state?.fieldErrors ?? {};
  const [dirty, setDirty] = useState(false);

  // clienteIdInicial gana: al volver del alta de cliente trae el recién creado.
  const [clienteId, setClienteId] = useState(clienteIdInicial ?? informe?.clienteId ?? "");
  const [motoId, setMotoId] = useState(informe?.motoId ?? "");
  const clienteActual = clientes.find((c) => c.id === clienteId);
  // Sin cliente registrado: datos sueltos del destinatario y su moto.
  const [contactoNombre, setContactoNombre] = useState(informe?.contactoNombre ?? "");
  const [contactoTelefono, setContactoTelefono] = useState(informe?.contactoTelefono ?? "");
  const [motoMarca, setMotoMarca] = useState(informe?.motoMarca ?? "");
  const [motoModelo, setMotoModelo] = useState(informe?.motoModelo ?? "");
  const [motoAnio, setMotoAnio] = useState(informe?.motoAnio ? String(informe.motoAnio) : "");
  const [motoPatente, setMotoPatente] = useState(informe?.motoPatente ?? "");

  const [items, setItems] = useState<Item[]>(() =>
    (informe?.items ?? []).map((d) => ({ key: nextKey(), ...d })),
  );
  const [servSel, setServSel] = useState("");

  /** Agrega lo elegido en el desplegable: línea en blanco o servicio del catálogo. */
  function agregarItem() {
    const s = servicios.find((x) => x.id === servSel);
    setItems((p) => [...p, { key: nextKey(), descripcion: s?.nombre ?? "", fotos: [] }]);
    setServSel("");
  }
  const updateItem = (key: number, patch: Partial<Item>) =>
    setItems((p) => p.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  const removeItem = (key: number) => setItems((p) => p.filter((i) => i.key !== key));

  const itemsJson = JSON.stringify(
    items.map(({ descripcion, fotos }) => ({ descripcion, fotos })),
  );

  return (
    <form
      action={formAction}
      className="space-y-6"
      onChange={() => setDirty(true)}
      onSubmit={() => setDirty(false)}
    >
      <UnsavedGuard active={dirty} />
      <input type="hidden" name="itemsJson" value={itemsJson} />

      {/* Datos */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Datos del informe</h2>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <FormField label="Cliente" htmlFor="clienteId" error={e.clienteId?.[0]}>
            <Select
              id="clienteId"
              name="clienteId"
              value={clienteId}
              onChange={(ev) => { setClienteId(ev.target.value); setMotoId(""); }}
            >
              <option value="">Sin cliente registrado</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>
              ))}
            </Select>
            <Link
              href={`/clientes/nuevo?returnTo=${encodeURIComponent(crearClienteReturnTo)}`}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Crear cliente nuevo
            </Link>
          </FormField>
          {clienteActual && (
            <FormField label="Moto" htmlFor="motoId">
              <Select
                id="motoId"
                name="motoId"
                value={motoId}
                onChange={(ev) => setMotoId(ev.target.value)}
              >
                <option value="">Sin especificar</option>
                {clienteActual.motos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.marca} {m.modelo}{m.patente ? ` (${m.patente})` : ""}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
          {/* Sin cliente registrado: nombre y teléfono del destinatario, y la moto anotada a mano. */}
          {!clienteActual && (
            <>
              <FormField
                label="A nombre de *"
                htmlFor="contactoNombre"
                error={e.contactoNombre?.[0]}
              >
                <Input
                  id="contactoNombre"
                  name="contactoNombre"
                  value={contactoNombre}
                  onChange={(ev) => setContactoNombre(ev.target.value)}
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </FormField>
              <FormField label="Teléfono / WhatsApp" htmlFor="contactoTelefono">
                <Input
                  id="contactoTelefono"
                  name="contactoTelefono"
                  type="tel"
                  value={contactoTelefono}
                  onChange={(ev) => setContactoTelefono(ev.target.value)}
                  placeholder="Ej: 11 5555-5555"
                />
              </FormField>
              <div className="grid gap-4 sm:col-span-2 sm:grid-cols-4">
                <FormField label="Moto (marca)" htmlFor="motoMarca">
                  <Input
                    id="motoMarca"
                    name="motoMarca"
                    value={motoMarca}
                    onChange={(ev) => setMotoMarca(ev.target.value)}
                    placeholder="Ej: Honda"
                  />
                </FormField>
                <FormField label="Modelo" htmlFor="motoModelo">
                  <Input
                    id="motoModelo"
                    name="motoModelo"
                    value={motoModelo}
                    onChange={(ev) => setMotoModelo(ev.target.value)}
                    placeholder="Ej: Wave 110"
                  />
                </FormField>
                <FormField label="Año" htmlFor="motoAnio" error={e.motoAnio?.[0]}>
                  <Input
                    id="motoAnio"
                    name="motoAnio"
                    type="number"
                    min="1900"
                    max="2100"
                    value={motoAnio}
                    onChange={(ev) => setMotoAnio(ev.target.value)}
                    placeholder="Ej: 2019"
                  />
                </FormField>
                <FormField label="Patente" htmlFor="motoPatente">
                  <Input
                    id="motoPatente"
                    name="motoPatente"
                    value={motoPatente}
                    onChange={(ev) => setMotoPatente(ev.target.value)}
                    placeholder="Ej: AB123CD"
                  />
                </FormField>
              </div>
              <p className="text-xs text-slate-400 sm:col-span-2">
                No se crea el cliente. Si lo querés guardar, dalo de alta desde el informe
                (con la moto incluida).
              </p>
            </>
          )}
          <FormField label="Título" htmlFor="titulo" className="sm:col-span-2">
            <Input
              id="titulo"
              name="titulo"
              defaultValue={informe?.titulo ?? ""}
              placeholder="Ej: Revisión general — Honda Wave 110"
            />
          </FormField>
        </CardBody>
      </Card>

      {/* Ítems */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Ítems del informe</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          {/* Un solo lugar para agregar: línea en blanco (default) o un servicio del catálogo. */}
          <div className="flex gap-2 sm:max-w-lg">
            <Select value={servSel} onChange={(ev) => setServSel(ev.target.value)}>
              <option value="">Agregar línea en blanco</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </Select>
            <Button type="button" variant="secondary" onClick={agregarItem} className="shrink-0">
              <Plus className="h-4 w-4" />
              Agregar ítem
            </Button>
          </div>
          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 py-4 text-center text-sm text-slate-400">
              Agregá lo que se revisó, se hizo o se encontró. Sin precios.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.key} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={i.descripcion}
                      onChange={(ev) => updateItem(i.key, { descripcion: ev.target.value })}
                      placeholder="Ej: Se cambió el kit de arrastre"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(i.key)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Quitar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <FotosLinea
                    fotos={i.fotos}
                    onChange={(fotos) => updateItem(i.key, { fotos })}
                  />
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Nota final */}
      <Card>
        <CardBody>
          <FormField label="Nota final" htmlFor="notaFinal">
            <Textarea
              id="notaFinal"
              name="notaFinal"
              defaultValue={informe?.notaFinal ?? ""}
              placeholder="Observaciones, recomendaciones, próximos pasos…"
            />
          </FormField>
        </CardBody>
      </Card>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <div className="flex justify-end gap-3">
        <LinkButton href="/informes" variant="outline">Cancelar</LinkButton>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
