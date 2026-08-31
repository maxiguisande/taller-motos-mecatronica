import { formatFecha } from "./format";
import { waLink } from "./contacto";

export function numeroInforme(n: number) {
  return "#I" + String(n).padStart(4, "0");
}

export type InformeMsg = {
  numero: number;
  titulo?: string | null;
  fecha: Date | string;
  moto?: { marca: string; modelo: string; patente: string | null } | null;
  items: { descripcion: string }[];
  notaFinal?: string | null;
};

/** Texto del informe para enviar por WhatsApp (sin precios). */
export function armarMensajeInforme(p: InformeMsg) {
  const lineas: string[] = [
    "*Mecatrónica Pilar — Taller de Motos*",
    `Informe ${numeroInforme(p.numero)} · ${formatFecha(p.fecha)}`,
  ];

  const titulo =
    p.titulo?.trim() ||
    (p.moto ? `${p.moto.marca} ${p.moto.modelo}${p.moto.patente ? ` (${p.moto.patente})` : ""}` : "");
  if (titulo) lineas.push("", `*${titulo}*`);

  if (p.items.length) {
    lineas.push("");
    p.items.forEach((i) => lineas.push(`• ${i.descripcion}`));
  }

  if (p.notaFinal?.trim()) lineas.push("", p.notaFinal.trim());

  return lineas.join("\n");
}

export function linkWhatsAppInforme(p: InformeMsg, telefono?: string | null) {
  const texto = encodeURIComponent(armarMensajeInforme(p));
  if (telefono) return `${waLink(telefono)}?text=${texto}`;
  return `https://wa.me/?text=${texto}`;
}
