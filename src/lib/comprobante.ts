import { formatFecha, formatMoneda, formatOrdenNumero } from "./format";
import { ESTADO_PAGO_LABEL } from "./constants";

type ItemLike = {
  descripcion: string;
  precio: number | string | { toString(): string };
  cantidad: number;
};

export type OrdenComprobante = {
  numero: number;
  fecha: Date | string;
  estadoPago: string;
  total: number | string | { toString(): string };
  moto?: { marca: string; modelo: string; patente: string | null } | null;
  items: ItemLike[];
};

/** Texto del comprobante para enviar por WhatsApp. */
export function armarMensaje(orden: OrdenComprobante) {
  const lineas = [
    "*Mecatrónica Pilar — Taller de Motos*",
    `Orden ${formatOrdenNumero(orden.numero)} · ${formatFecha(orden.fecha)}`,
    orden.moto
      ? `Moto: ${orden.moto.marca} ${orden.moto.modelo}${
          orden.moto.patente ? ` (${orden.moto.patente})` : ""
        }`
      : "",
    "",
    "Detalle:",
    ...orden.items.map(
      (i) =>
        `• ${i.descripcion}${i.cantidad > 1 ? ` x${i.cantidad}` : ""} — ${formatMoneda(
          Number(i.precio) * i.cantidad,
        )}`,
    ),
    "",
    `Total: ${formatMoneda(orden.total)}`,
    `Pago: ${ESTADO_PAGO_LABEL[orden.estadoPago] ?? orden.estadoPago}`,
    "",
    "¡Gracias por confiar en nosotros!",
  ].filter((l) => l !== "");
  return lineas.join("\n");
}

/** Link wa.me con el comprobante. Si hay teléfono, lo dirige a ese contacto. */
export function armarLinkWhatsApp(
  orden: OrdenComprobante,
  telefono?: string | null,
) {
  const texto = encodeURIComponent(armarMensaje(orden));
  if (telefono) {
    let d = telefono.replace(/\D/g, "");
    // Heurística Argentina: si no tiene código de país, anteponer 54 9 (celular).
    if (d && !d.startsWith("54")) d = "549" + d;
    if (d) return `https://wa.me/${d}?text=${texto}`;
  }
  return `https://wa.me/?text=${texto}`;
}
