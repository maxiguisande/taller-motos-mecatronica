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

type ContactoCliente = { tipo: string; valor: string; principal: boolean };

/**
 * A quién va dirigido el presupuesto: el cliente registrado (con el mejor
 * teléfono que tenga cargado) o, si no hay cliente, el contacto suelto.
 */
export function destinatarioPresu(p: {
  cliente: { nombre: string; apellido: string; contactos: ContactoCliente[] } | null;
  contactoNombre: string | null;
  contactoTelefono: string | null;
}): { nombre: string; telefono: string | null; registrado: boolean } {
  if (p.cliente) {
    const c = p.cliente.contactos;
    return {
      nombre: `${p.cliente.nombre} ${p.cliente.apellido}`,
      telefono:
        c.find((x) => x.tipo === "whatsapp")?.valor ??
        c.find((x) => x.tipo === "celular")?.valor ??
        c.find((x) => x.principal)?.valor ??
        null,
      registrado: true,
    };
  }
  return {
    nombre: p.contactoNombre?.trim() || "Sin cliente",
    telefono: p.contactoTelefono?.trim() || null,
    registrado: false,
  };
}

type MotoDisplay = { marca: string; modelo: string; patente: string | null };

/**
 * Moto del presupuesto para mostrar: la Moto del cliente registrado o, si no
 * hay, la anotada a mano (marca/modelo/año/patente sueltos). Null si no hay nada.
 */
export function motoPresu(p: {
  moto: MotoDisplay | null;
  motoMarca: string | null;
  motoModelo: string | null;
  motoAnio: number | null;
  motoPatente: string | null;
}): MotoDisplay | null {
  if (p.moto) return p.moto;
  const [marca = "", ...resto] = [
    p.motoMarca?.trim(),
    p.motoModelo?.trim(),
    p.motoAnio ? String(p.motoAnio) : undefined,
  ].filter((x): x is string => !!x);
  const patente = p.motoPatente?.trim() || null;
  if (!marca && !patente) return null;
  return { marca, modelo: resto.join(" "), patente };
}
