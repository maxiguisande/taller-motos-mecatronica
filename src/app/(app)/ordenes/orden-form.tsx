"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Layers, Wrench, Package, DollarSign } from "lucide-react";
import type { FormState } from "@/lib/form";
import { formatMoneda } from "@/lib/format";
import { totalesOrden } from "@/lib/orden";
import { ESTADOS_ORDEN, ESTADOS_PAGO, MEDIOS_PAGO, MONEDAS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { Button, LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { UnsavedGuard } from "@/components/unsaved-guard";
import { FotosItem } from "@/components/fotos-item";

type Servicio = { id: string; nombre: string };
type Producto = { id: string; nombre: string; precio: number; stock: number };
type Grupo = { id: string; nombre: string; servicios: Servicio[] };
type Cliente = {
  id: string;
  nombre: string;
  apellido: string;
  motos: { id: string; marca: string; modelo: string; patente: string | null }[];
};
type Mecanico = { id: string; nombre: string };
type Foto = { id: string; url: string };

type Tipo = "servicio" | "repuesto" | "manual" | "mano_obra";

type Item = {
  key: number;
  id?: string; // id en la base (ítems que ya existían); permite mostrar sus fotos
  tipo: Tipo;
  servicioId: string | null;
  productoId: string | null;
  descripcion: string;
  precio: number;
  moneda: "ARS" | "USD";
  cantidad: number;
  fotos?: Foto[];
};

type OrdenDefaults = {
  clienteId: string;
  motoId: string | null;
  mecanicoId: string | null;
  fecha: string;
  estado: string;
  kilometraje: number | null;
  estadoPago: string;
  medioPago: string | null;
  notas: string | null;
  items: Omit<Item, "key">[];
};

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

export function OrdenForm({
  action,
  clientes,
  servicios,
  grupos,
  productos,
  mecanicos,
  orden,
  ordenId,
  fotosIngreso = [],
  fotosSalida = [],
  clienteIdInicial,
  motoIdInicial,
  presupuestoId,
  turnoId,
  itemsIniciales,
  submitLabel = "Guardar orden",
}: {
  action: (prev: FormState | undefined, fd: FormData) => Promise<FormState | undefined>;
  clientes: Cliente[];
  servicios: Servicio[];
  grupos: Grupo[];
  productos: Producto[];
  mecanicos: Mecanico[];
  orden?: OrdenDefaults;
  ordenId?: string;
  fotosIngreso?: Foto[];
  fotosSalida?: Foto[];
  clienteIdInicial?: string;
  motoIdInicial?: string;
  presupuestoId?: string;
  turnoId?: string;
  itemsIniciales?: Omit<Item, "key">[];
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const [dirty, setDirty] = useState(false);
  const keyRef = useRef(0);
  const nextKey = () => ++keyRef.current;

  // Orden completada: no se tocan servicios/repuestos ni los datos; solo el
  // cobro (mano de obra) y las fotos.
  const bloqueado = orden?.estado === "completado";

  const [clienteId, setClienteId] = useState(orden?.clienteId ?? clienteIdInicial ?? "");
  const [motoId, setMotoId] = useState(orden?.motoId ?? motoIdInicial ?? "");
  const [items, setItems] = useState<Item[]>(
    () =>
      (orden?.items ?? itemsIniciales ?? []).map((i) => ({ ...i, key: nextKey() })),
  );
  const [servicioSel, setServicioSel] = useState("");
  const [grupoSel, setGrupoSel] = useState("");
  const [productoSel, setProductoSel] = useState("");

  const clienteActual = clientes.find((c) => c.id === clienteId);
  const trabajo = items.filter((i) => i.tipo !== "mano_obra");
  const labor = items.filter((i) => i.tipo === "mano_obra");
  const totales = useMemo(() => totalesOrden(items), [items]);

  function addServicio() {
    const s = servicios.find((x) => x.id === servicioSel);
    if (!s) return;
    setItems((p) => [
      ...p,
      { key: nextKey(), tipo: "servicio", servicioId: s.id, productoId: null, descripcion: s.nombre, precio: 0, moneda: "ARS", cantidad: 1 },
    ]);
    setServicioSel("");
  }
  function addGrupo() {
    const g = grupos.find((x) => x.id === grupoSel);
    if (!g) return;
    setItems((p) => [
      ...p,
      ...g.servicios.map((s) => ({
        key: nextKey(), tipo: "servicio" as const, servicioId: s.id, productoId: null, descripcion: s.nombre, precio: 0, moneda: "ARS" as const, cantidad: 1,
      })),
    ]);
    setGrupoSel("");
  }
  function addProducto() {
    const pr = productos.find((x) => x.id === productoSel);
    if (!pr) return;
    setItems((p) => [
      ...p,
      { key: nextKey(), tipo: "repuesto", servicioId: null, productoId: pr.id, descripcion: pr.nombre, precio: pr.precio, moneda: "ARS", cantidad: 1 },
    ]);
    setProductoSel("");
  }
  function addManual() {
    setItems((p) => [
      ...p,
      { key: nextKey(), tipo: "manual", servicioId: null, productoId: null, descripcion: "", precio: 0, moneda: "ARS", cantidad: 1 },
    ]);
  }
  function addLabor() {
    setItems((p) => [
      ...p,
      { key: nextKey(), tipo: "mano_obra", servicioId: null, productoId: null, descripcion: "Mano de obra", precio: 0, moneda: "ARS", cantidad: 1 },
    ]);
  }
  function updateItem(key: number, patch: Partial<Item>) {
    setItems((p) => p.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }
  function removeItem(key: number) {
    setItems((p) => p.filter((i) => i.key !== key));
  }

  const itemsJson = JSON.stringify(
    items.map(({ id, tipo, servicioId, productoId, descripcion, precio, moneda, cantidad }) => ({
      id, tipo, servicioId, productoId, descripcion, precio, moneda, cantidad: Math.max(1, cantidad || 1),
    })),
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
      {presupuestoId && <input type="hidden" name="presupuestoId" value={presupuestoId} />}
      {turnoId && <input type="hidden" name="turnoId" value={turnoId} />}
      {/* Con la orden completada, estos datos no se editan pero se envían igual. */}
      {bloqueado && (
        <>
          <input type="hidden" name="clienteId" value={clienteId} />
          <input type="hidden" name="motoId" value={motoId} />
          <input type="hidden" name="fecha" value={orden?.fecha ?? hoy()} />
          <input type="hidden" name="mecanicoId" value={orden?.mecanicoId ?? ""} />
          <input type="hidden" name="estado" value="completado" />
          <input type="hidden" name="kilometraje" value={orden?.kilometraje ?? ""} />
        </>
      )}

      {bloqueado && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          La orden está <b>completada</b>: solo podés editar el cobro y las fotos.
          Los servicios y repuestos quedan fijos.
        </p>
      )}

      {/* Datos de la orden */}
      {!bloqueado && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Datos de la orden</h2>
          </CardHeader>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <FormField label="Cliente *" htmlFor="clienteId" error={state?.fieldErrors?.clienteId?.[0]}>
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

            <FormField label="Fecha *" htmlFor="fecha" error={state?.fieldErrors?.fecha?.[0]}>
              <Input id="fecha" name="fecha" type="date" defaultValue={orden?.fecha ?? hoy()} required />
            </FormField>

            <FormField label="Mecánico" htmlFor="mecanicoId">
              <Select id="mecanicoId" name="mecanicoId" defaultValue={orden?.mecanicoId ?? ""}>
                <option value="">Sin asignar</option>
                {mecanicos.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Estado" htmlFor="estado">
              <Select id="estado" name="estado" defaultValue={orden?.estado ?? "pendiente"}>
                {ESTADOS_ORDEN.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Kilometraje" htmlFor="kilometraje">
              <Input id="kilometraje" name="kilometraje" type="number" min="0" defaultValue={orden?.kilometraje ?? ""} placeholder="Ej: 25000" />
            </FormField>

            <FormField label="Notas" htmlFor="notas" className="sm:col-span-2">
              <Textarea id="notas" name="notas" defaultValue={orden?.notas ?? ""} />
            </FormField>
          </CardBody>
        </Card>
      )}

      {/* Servicios y repuestos */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Servicios y repuestos</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          {!bloqueado && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex gap-2">
                <Select value={servicioSel} onChange={(ev) => setServicioSel(ev.target.value)}>
                  <option value="">Servicio…</option>
                  {servicios.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </Select>
                <Button type="button" variant="secondary" onClick={addServicio} title="Agregar servicio">
                  <Wrench className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Select value={productoSel} onChange={(ev) => setProductoSel(ev.target.value)}>
                  <option value="">Repuesto…</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} — {formatMoneda(p.precio)} (stock {p.stock})</option>
                  ))}
                </Select>
                <Button type="button" variant="secondary" onClick={addProducto} title="Agregar repuesto">
                  <Package className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Select value={grupoSel} onChange={(ev) => setGrupoSel(ev.target.value)}>
                  <option value="">Grupo completo…</option>
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>{g.nombre} ({g.servicios.length})</option>
                  ))}
                </Select>
                <Button type="button" variant="secondary" onClick={addGrupo} title="Agregar grupo">
                  <Layers className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {trabajo.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-sm text-slate-400">
              {bloqueado ? "Sin servicios ni repuestos." : "Agregá servicios, repuestos o un grupo completo."}
            </p>
          ) : bloqueado ? (
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {trabajo.map((i) => (
                <div key={i.key} className="px-3 py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        i.tipo === "repuesto" ? "bg-violet-50 text-violet-600" : "bg-brand-50 text-brand-700",
                      )}
                    >
                      {i.tipo === "repuesto" ? <Package className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-slate-800">
                      {i.descripcion}
                      {i.cantidad > 1 ? ` (x${i.cantidad})` : ""}
                    </span>
                    {i.tipo !== "servicio" && i.precio > 0 && (
                      <span className="shrink-0 font-medium text-slate-900">
                        {formatMoneda(i.precio * i.cantidad, i.moneda)}
                      </span>
                    )}
                  </div>
                  {ordenId && i.id && (
                    <div className="pl-11">
                      <FotosItem uploadFields={{ ordenItemId: i.id }} fotos={i.fotos ?? []} editable deletable />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {trabajo.map((i) => (
                <div key={i.key} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-end gap-2">
                    <span
                      className={cn(
                        "hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:flex",
                        i.tipo === "repuesto" ? "bg-violet-50 text-violet-600" : "bg-brand-50 text-brand-700",
                      )}
                      title={i.tipo === "repuesto" ? "Repuesto" : "Servicio"}
                    >
                      {i.tipo === "repuesto" ? <Package className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                    </span>
                    <FormField label="Descripción" className="min-w-[10rem] flex-1">
                      <Input value={i.descripcion} onChange={(ev) => updateItem(i.key, { descripcion: ev.target.value })} placeholder="Detalle" />
                    </FormField>
                    {i.tipo !== "servicio" && (
                      <>
                        <FormField label="Precio" className="w-28">
                          <Input type="number" step="0.01" min="0" value={i.precio || ""} placeholder="0" onChange={(ev) => updateItem(i.key, { precio: Number(ev.target.value) })} />
                        </FormField>
                        <FormField label="Moneda" className="w-24">
                          <Select value={i.moneda} onChange={(ev) => updateItem(i.key, { moneda: ev.target.value as "ARS" | "USD" })}>
                            {MONEDAS.map((m) => (
                              <option key={m.value} value={m.value}>{m.value}</option>
                            ))}
                          </Select>
                        </FormField>
                        <FormField label="Cant." className="w-20">
                          <Input
                            type="number"
                            min="1"
                            value={i.cantidad || ""}
                            placeholder="1"
                            onFocus={(ev) => ev.currentTarget.select()}
                            onChange={(ev) => updateItem(i.key, { cantidad: Number(ev.target.value) })}
                            onBlur={(ev) => {
                              if (!ev.target.value || Number(ev.target.value) < 1) updateItem(i.key, { cantidad: 1 });
                            }}
                          />
                        </FormField>
                      </>
                    )}
                    <button type="button" onClick={() => removeItem(i.key)} className="mb-1 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Quitar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {ordenId && i.id && (
                    <div className="mt-1 sm:pl-11">
                      <FotosItem uploadFields={{ ordenItemId: i.id }} fotos={i.fotos ?? []} editable deletable />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!bloqueado && (
            <Button type="button" variant="ghost" size="sm" onClick={addManual}>
              <Plus className="h-4 w-4" />
              Ítem manual
            </Button>
          )}
        </CardBody>
      </Card>

      {/* Fotos (solo al editar una orden existente) */}
      {ordenId && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Fotos de la moto</h2>
          </CardHeader>
          <CardBody className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-600">Ingreso</p>
              <FotosItem uploadFields={{ ordenId, categoria: "ingreso" }} fotos={fotosIngreso} editable deletable />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-600">Salida</p>
              <FotosItem uploadFields={{ ordenId, categoria: "salida" }} fotos={fotosSalida} editable deletable />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Cobro */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Cobro</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Estado de pago" htmlFor="estadoPago">
              <Select id="estadoPago" name="estadoPago" defaultValue={orden?.estadoPago ?? "pendiente"}>
                {ESTADOS_PAGO.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Medio de pago" htmlFor="medioPago">
              <Select id="medioPago" name="medioPago" defaultValue={orden?.medioPago ?? ""}>
                <option value="">—</option>
                {MEDIOS_PAGO.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </Select>
            </FormField>
          </div>

          {/* Mano de obra: una o varias líneas (ej: una parte en USD y otra en ARS) */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">Mano de obra</p>
            {labor.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 py-3 text-center text-sm text-slate-400">
                Agregá una o más líneas de mano de obra.
              </p>
            ) : (
              labor.map((i) => (
                <div key={i.key} className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-3">
                  <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 sm:flex">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <FormField label="Concepto" className="min-w-[9rem] flex-1">
                    <Input value={i.descripcion} onChange={(ev) => updateItem(i.key, { descripcion: ev.target.value })} placeholder="Mano de obra" />
                  </FormField>
                  <FormField label="Importe" className="w-28">
                    <Input type="number" step="0.01" min="0" value={i.precio || ""} placeholder="0" onChange={(ev) => updateItem(i.key, { precio: Number(ev.target.value) })} />
                  </FormField>
                  <FormField label="Moneda" className="w-24">
                    <Select value={i.moneda} onChange={(ev) => updateItem(i.key, { moneda: ev.target.value as "ARS" | "USD" })}>
                      {MONEDAS.map((m) => (
                        <option key={m.value} value={m.value}>{m.value}</option>
                      ))}
                    </Select>
                  </FormField>
                  <button type="button" onClick={() => removeItem(i.key)} className="mb-1 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Quitar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
            <Button type="button" variant="ghost" size="sm" onClick={addLabor}>
              <Plus className="h-4 w-4" />
              Agregar mano de obra
            </Button>
          </div>

          <div className="space-y-1 border-t border-slate-100 pt-3 text-sm">
            {(totales.ARS !== 0 || totales.USD === 0) && (
              <div className="flex justify-between text-lg font-bold text-slate-900">
                <span>Total pesos</span><span>{formatMoneda(totales.ARS, "ARS")}</span>
              </div>
            )}
            {totales.USD !== 0 && (
              <div className="flex justify-between text-lg font-bold text-slate-900">
                <span>Total dólares</span><span>{formatMoneda(totales.USD, "USD")}</span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <div className="flex justify-end gap-3">
        <LinkButton href={ordenId ? `/ordenes/${ordenId}` : "/ordenes"} variant="outline">Cancelar</LinkButton>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
