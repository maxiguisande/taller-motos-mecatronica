"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Wrench, Layers, UserPlus } from "lucide-react";
import type { FormState } from "@/lib/form";
import { formatMoneda } from "@/lib/format";
import { ESTADOS_PRESUPUESTO, MONEDAS } from "@/lib/constants";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { Button, LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { UnsavedGuard } from "@/components/unsaved-guard";

type Servicio = { id: string; nombre: string };
type Grupo = { id: string; nombre: string; servicios: { nombre: string }[] };
type Cliente = {
  id: string;
  nombre: string;
  apellido: string;
  motos: { id: string; marca: string; modelo: string; patente: string | null }[];
};

type ServInc = { key: number; descripcion: string };
type Costo = { key: number; descripcion: string; importe: number; moneda: string };

type PresuDefaults = {
  clienteId: string;
  motoId: string | null;
  titulo: string | null;
  estado: string;
  validezHasta: string | null; // YYYY-MM-DD
  clienteTrae: string | null;
  notaFinal: string | null;
  servicios: string[];
  items: { descripcion: string; importe: number; moneda: string }[];
};

function hoyMas(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function PresupuestoForm({
  action,
  clientes,
  servicios,
  grupos,
  presupuesto,
  clienteIdInicial,
  submitLabel = "Guardar",
}: {
  action: (prev: FormState | undefined, fd: FormData) => Promise<FormState | undefined>;
  clientes: Cliente[];
  servicios: Servicio[];
  grupos: Grupo[];
  presupuesto?: PresuDefaults;
  clienteIdInicial?: string;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const e = state?.fieldErrors ?? {};
  const [dirty, setDirty] = useState(false);
  const keyRef = useRef(0);
  const nextKey = () => ++keyRef.current;

  const [clienteId, setClienteId] = useState(presupuesto?.clienteId ?? clienteIdInicial ?? "");
  const [motoId, setMotoId] = useState(presupuesto?.motoId ?? "");
  const clienteActual = clientes.find((c) => c.id === clienteId);

  const [serv, setServ] = useState<ServInc[]>(
    () => (presupuesto?.servicios ?? []).map((d) => ({ key: nextKey(), descripcion: d })),
  );
  const [costos, setCostos] = useState<Costo[]>(
    () => (presupuesto?.items ?? []).map((i) => ({ key: nextKey(), ...i })),
  );
  const [servSel, setServSel] = useState("");
  const [grupoSel, setGrupoSel] = useState("");

  function addServ() {
    const s = servicios.find((x) => x.id === servSel);
    if (!s) return;
    setServ((p) => [...p, { key: nextKey(), descripcion: s.nombre }]);
    setServSel("");
  }
  function addGrupo() {
    const g = grupos.find((x) => x.id === grupoSel);
    if (!g) return;
    setServ((p) => [...p, ...g.servicios.map((s) => ({ key: nextKey(), descripcion: s.nombre }))]);
    setGrupoSel("");
  }
  function updateServ(key: number, descripcion: string) {
    setServ((p) => p.map((s) => (s.key === key ? { ...s, descripcion } : s)));
  }
  const removeServ = (key: number) => setServ((p) => p.filter((s) => s.key !== key));

  function addCosto() {
    setCostos((p) => [...p, { key: nextKey(), descripcion: "", importe: 0, moneda: "ARS" }]);
  }
  function updateCosto(key: number, patch: Partial<Costo>) {
    setCostos((p) => p.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }
  const removeCosto = (key: number) => setCostos((p) => p.filter((c) => c.key !== key));

  const totales = useMemo(() => {
    const t: Record<string, number> = {};
    for (const c of costos) t[c.moneda] = (t[c.moneda] ?? 0) + (c.importe || 0);
    return t;
  }, [costos]);

  const serviciosJson = JSON.stringify(serv.map((s) => s.descripcion));
  const itemsJson = JSON.stringify(
    costos.map(({ descripcion, importe, moneda }) => ({ descripcion, importe, moneda })),
  );

  return (
    <form
      action={formAction}
      className="space-y-6"
      onChange={() => setDirty(true)}
      onSubmit={() => setDirty(false)}
    >
      <UnsavedGuard active={dirty} />
      <input type="hidden" name="serviciosJson" value={serviciosJson} />
      <input type="hidden" name="itemsJson" value={itemsJson} />

      {/* Datos */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Datos del presupuesto</h2>
        </CardHeader>
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
            <Link
              href="/clientes/nuevo?returnTo=/presupuestos/nuevo"
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Crear cliente nuevo
            </Link>
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
          <FormField label="Título" htmlFor="titulo" className="sm:col-span-2">
            <Input
              id="titulo"
              name="titulo"
              defaultValue={presupuesto?.titulo ?? ""}
              placeholder="Ej: Service Completo — CFMoto MT800"
            />
          </FormField>
          <FormField label="Estado" htmlFor="estado">
            <Select id="estado" name="estado" defaultValue={presupuesto?.estado ?? "borrador"}>
              {ESTADOS_PRESUPUESTO.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Válido hasta" htmlFor="validezHasta">
            <Input
              id="validezHasta"
              name="validezHasta"
              type="date"
              defaultValue={presupuesto?.validezHasta ?? hoyMas(7)}
            />
          </FormField>
        </CardBody>
      </Card>

      {/* Servicios incluidos */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Servicios incluidos</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex gap-2">
              <Select value={servSel} onChange={(ev) => setServSel(ev.target.value)}>
                <option value="">Agregar servicio…</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </Select>
              <Button type="button" variant="secondary" onClick={addServ} title="Agregar servicio">
                <Wrench className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Select value={grupoSel} onChange={(ev) => setGrupoSel(ev.target.value)}>
                <option value="">Agregar grupo completo…</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>{g.nombre} ({g.servicios.length})</option>
                ))}
              </Select>
              <Button type="button" variant="secondary" onClick={addGrupo} title="Agregar grupo">
                <Layers className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {serv.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 py-4 text-center text-sm text-slate-400">
              Agregá los servicios/tareas que incluye.
            </p>
          ) : (
            <div className="space-y-2">
              {serv.map((s) => (
                <div key={s.key} className="flex items-center gap-2">
                  <Input value={s.descripcion} onChange={(ev) => updateServ(s.key, ev.target.value)} />
                  <button
                    type="button"
                    onClick={() => removeServ(s.key)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Quitar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Costos */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Costos</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          {costos.map((c) => (
            <div key={c.key} className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-3">
              <FormField label="Descripción" className="min-w-[10rem] flex-1">
                <Input
                  value={c.descripcion}
                  onChange={(ev) => updateCosto(c.key, { descripcion: ev.target.value })}
                  placeholder="Ej: Mano de obra / Aceite Ipone Katana 3L"
                />
              </FormField>
              <FormField label="Importe" className="w-32">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={c.importe || ""}
                  onChange={(ev) => updateCosto(c.key, { importe: Number(ev.target.value) })}
                  placeholder="0"
                />
              </FormField>
              <FormField label="Moneda" className="w-28">
                <Select value={c.moneda} onChange={(ev) => updateCosto(c.key, { moneda: ev.target.value })}>
                  {MONEDAS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </Select>
              </FormField>
              <button
                type="button"
                onClick={() => removeCosto(c.key)}
                className="mb-1 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Quitar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={addCosto}>
            <Plus className="h-4 w-4" />
            Agregar costo
          </Button>
          {Object.keys(totales).length > 0 && (
            <div className="flex flex-wrap justify-end gap-x-6 gap-y-1 border-t border-slate-100 pt-3 text-sm">
              {Object.entries(totales).map(([m, v]) => (
                <span key={m} className="font-semibold text-slate-900">
                  Total {m}: {formatMoneda(v, m)}
                </span>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Extras */}
      <Card>
        <CardBody className="space-y-4">
          <FormField label="Lo trae el cliente (uno por línea)" htmlFor="clienteTrae">
            <Textarea
              id="clienteTrae"
              name="clienteTrae"
              defaultValue={presupuesto?.clienteTrae ?? ""}
              placeholder={"Junta de tapa de válvulas\nBujías\nFiltro de aire\nFiltro de aceite"}
            />
          </FormField>
          <FormField label="Nota final" htmlFor="notaFinal">
            <Textarea
              id="notaFinal"
              name="notaFinal"
              defaultValue={presupuesto?.notaFinal ?? "Si surge algo más para hacer, se cotiza en el momento."}
            />
          </FormField>
        </CardBody>
      </Card>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <div className="flex justify-end gap-3">
        <LinkButton href="/presupuestos" variant="outline">Cancelar</LinkButton>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
