import { formatFecha, formatMoneda, formatOrdenNumero } from "./format";
import { ESTADO_PAGO_LABEL } from "./constants";
import { totalesOrden } from "./orden";

type ItemLike = {
  tipo: string;
  descripcion: string;
  precio: number | string | { toString(): string };
  moneda: string;
  cantidad: number;
};

export type OrdenComprobante = {
  numero: number;
  fecha: Date | string;
  estadoPago: string;
  moto?: { marca: string; modelo: string; patente: string | null } | null;
  items: ItemLike[];
};

/** Texto del comprobante para enviar por WhatsApp. */
export function armarMensaje(orden: OrdenComprobante) {
  const servicios = orden.items.filter((i) => i.tipo === "servicio");
  const otros = orden.items.filter((i) => i.tipo !== "servicio");

  const lineas: string[] = [
    "*Mecatrónica Pilar — Taller de Motos*",
    `Orden ${formatOrdenNumero(orden.numero)} · ${formatFecha(orden.fecha)}`,
    orden.moto
      ? `Moto: ${orden.moto.marca} ${orden.moto.modelo}${
          orden.moto.patente ? ` (${orden.moto.patente})` : ""
        }`
      : "",
    "",
  ];

  if (servicios.length) {
    lineas.push("Trabajos realizados:");
    servicios.forEach((s) => lineas.push(`• ${s.descripcion}`));
    lineas.push("");
  }

  otros.forEach((o) =>
    lineas.push(
      `${o.descripcion}${o.cantidad > 1 ? ` x${o.cantidad}` : ""}: ${formatMoneda(
        Number(o.precio) * o.cantidad,
        o.moneda,
      )}`,
    ),
  );

  const t = totalesOrden(orden.items);
  lineas.push("");
  if (t.ARS !== 0 || t.USD === 0) lineas.push(`*Total: ${formatMoneda(t.ARS, "ARS")}*`);
  if (t.USD !== 0) lineas.push(`*Total USD: ${formatMoneda(t.USD, "USD")}*`);
  lineas.push(
    `Pago: ${ESTADO_PAGO_LABEL[orden.estadoPago] ?? orden.estadoPago}`,
    "",
    "¡Gracias por confiar en nosotros!",
  );
  return lineas.filter((l, idx) => !(l === "" && lineas[idx - 1] === "")).join("\n");
}

/** Link wa.me con el comprobante. Si hay teléfono, lo dirige a ese contacto. */
export function armarLinkWhatsApp(
  orden: OrdenComprobante,
  telefono?: string | null,
) {
  const texto = encodeURIComponent(armarMensaje(orden));
  if (telefono) {
    let d = telefono.replace(/\D/g, "");
    if (d && !d.startsWith("54")) d = "549" + d;
    if (d) return `https://wa.me/${d}?text=${texto}`;
  }
  return `https://wa.me/?text=${texto}`;
}
