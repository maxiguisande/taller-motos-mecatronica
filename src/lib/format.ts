const monedaFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

const fechaFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const fechaLargaFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

/** Acepta number, string o Prisma.Decimal (que expone toString). */
export function formatMoneda(valor: number | string | { toString(): string }) {
  const n = typeof valor === "number" ? valor : Number(valor.toString());
  return monedaFmt.format(isNaN(n) ? 0 : n);
}

export function formatFecha(fecha: Date | string) {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return fechaFmt.format(d);
}

export function formatFechaLarga(fecha: Date | string) {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return fechaLargaFmt.format(d);
}

const fechaHoraFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatFechaHora(fecha: Date | string) {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return fechaHoraFmt.format(d);
}

/** Duración legible entre dos instantes: "1h 45m", "50m", "—". */
export function formatDuracion(
  desde: Date | string | null,
  hasta: Date | string | null,
) {
  if (!desde || !hasta) return "—";
  const ms = new Date(hasta).getTime() - new Date(desde).getTime();
  if (isNaN(ms) || ms < 0) return "—";
  const min = Math.round(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/** Para inputs type="date" (YYYY-MM-DD). */
export function toDateInput(fecha: Date | string) {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return d.toISOString().slice(0, 10);
}

/** Para inputs type="datetime-local" (YYYY-MM-DDTHH:mm) en hora local. */
export function toDateTimeInput(fecha: Date | string) {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}
