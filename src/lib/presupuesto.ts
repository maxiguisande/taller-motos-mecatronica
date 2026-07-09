import { formatMoneda, formatFecha } from "./format";

export function numeroPresu(n: number) {
  return "#P" + String(n).padStart(4, "0");
}

export type PresupuestoMsg = {
  numero: number;
  titulo?: string | null;
  validezHasta?: Date | string | null;
  moto?: { marca: string; modelo: string; patente: string | null } | null;
  servicios: { descripcion: string }[];
  items: { descripcion: string; importe: number | string | { toString(): string }; moneda: string }[];
  clienteTrae?: string | null;
  notaFinal?: string | null;
};

/** Texto del presupuesto para enviar por WhatsApp. */
export function armarMensajePresu(p: PresupuestoMsg) {
  const lineas: string[] = [
    "*Mecatrónica Pilar — Taller de Motos*",
    `Presupuesto ${numeroPresu(p.numero)}${
      p.validezHasta ? ` · válido hasta ${formatFecha(p.validezHasta)}` : ""
    }`,
  ];

  const titulo =
    p.titulo?.trim() ||
    (p.moto ? `${p.moto.marca} ${p.moto.modelo}${p.moto.patente ? ` (${p.moto.patente})` : ""}` : "");
  if (titulo) lineas.push("", `*${titulo}*`);

  if (p.servicios.length) {
    lineas.push("");
    p.servicios.forEach((s) => lineas.push(`• ${s.descripcion}`));
  }

  if (p.items.length) {
    lineas.push("");
    p.items.forEach((i) =>
      lineas.push(`${i.descripcion}: ${formatMoneda(Number(i.importe), i.moneda)}`),
    );
  }

  const trae = (p.clienteTrae ?? "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  if (trae.length) {
    lineas.push("", "Traés vos:");
    trae.forEach((x) => lineas.push(`• ${x}`));
  }

  if (p.notaFinal?.trim()) lineas.push("", p.notaFinal.trim());

  return lineas.join("\n");
}

export function linkWhatsAppPresu(p: PresupuestoMsg, telefono?: string | null) {
  const texto = encodeURIComponent(armarMensajePresu(p));
  if (telefono) {
    let d = telefono.replace(/\D/g, "");
    if (d && !d.startsWith("54")) d = "549" + d;
    if (d) return `https://wa.me/${d}?text=${texto}`;
  }
  return `https://wa.me/?text=${texto}`;
}
