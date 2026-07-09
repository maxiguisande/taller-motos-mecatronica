export const ESTADOS_ORDEN = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "completado", label: "Completado" },
] as const;

export type EstadoOrden = (typeof ESTADOS_ORDEN)[number]["value"];

export const ESTADO_LABEL: Record<string, string> = Object.fromEntries(
  ESTADOS_ORDEN.map((e) => [e.value, e.label]),
);

export const ESTADO_COLOR: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-800 ring-amber-600/20",
  en_proceso: "bg-blue-100 text-blue-800 ring-blue-600/20",
  completado: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
};

export const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "empleado", label: "Empleado" },
] as const;

// ── Contactos ──────────────────────────────────
export const TIPOS_CONTACTO = [
  { value: "celular", label: "Celular" },
  { value: "fijo", label: "Teléfono fijo" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "instagram", label: "Instagram" },
] as const;

export const TIPO_CONTACTO_LABEL: Record<string, string> = Object.fromEntries(
  TIPOS_CONTACTO.map((t) => [t.value, t.label]),
);

// ── Cobros ─────────────────────────────────────
export const ESTADOS_PAGO = [
  { value: "pendiente", label: "Pendiente" },
  { value: "parcial", label: "Parcial" },
  { value: "pagado", label: "Pagado" },
] as const;

export const ESTADO_PAGO_LABEL: Record<string, string> = Object.fromEntries(
  ESTADOS_PAGO.map((e) => [e.value, e.label]),
);

export const ESTADO_PAGO_COLOR: Record<string, string> = {
  pendiente: "bg-red-100 text-red-800 ring-red-600/20",
  parcial: "bg-amber-100 text-amber-800 ring-amber-600/20",
  pagado: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
};

export const MEDIOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "mercadopago", label: "Mercado Pago" },
] as const;

export const MEDIO_PAGO_LABEL: Record<string, string> = Object.fromEntries(
  MEDIOS_PAGO.map((m) => [m.value, m.label]),
);

// ── Turnos ─────────────────────────────────────
export const ESTADOS_TURNO = [
  { value: "pendiente", label: "Pendiente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "realizado", label: "Realizado" },
  { value: "cancelado", label: "Cancelado" },
] as const;

export const ESTADO_TURNO_LABEL: Record<string, string> = Object.fromEntries(
  ESTADOS_TURNO.map((e) => [e.value, e.label]),
);

export const ESTADO_TURNO_COLOR: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-800 ring-amber-600/20",
  confirmado: "bg-blue-100 text-blue-800 ring-blue-600/20",
  realizado: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  cancelado: "bg-slate-100 text-slate-600 ring-slate-600/20",
};

// ── Ítems de orden ─────────────────────────────
export const TIPO_ITEM = {
  servicio: "servicio",
  repuesto: "repuesto",
  manual: "manual",
} as const;
