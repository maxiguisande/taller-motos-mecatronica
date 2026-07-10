import { formatFechaHora } from "./format";
import { waLink } from "./contacto";

type TurnoRecordatorio = {
  fecha: Date | string;
  motivo?: string | null;
  cliente: { nombre: string };
  moto?: { marca: string; modelo: string } | null;
};

/** Mensaje de recordatorio de turno para enviar por WhatsApp. */
export function mensajeRecordatorioTurno(t: TurnoRecordatorio) {
  const cuando = formatFechaHora(t.fecha);
  const moto = t.moto ? ` con tu ${t.moto.marca} ${t.moto.modelo}` : "";
  const motivo = t.motivo ? ` por *${t.motivo}*` : "";
  return (
    `Hola ${t.cliente.nombre} 👋 Te recordamos tu turno en ` +
    `*Mecatrónica Pilar — Taller de Motos* el ${cuando}${motivo}${moto}. ¡Te esperamos!`
  );
}

/** Link wa.me con el recordatorio. Si hay teléfono, lo dirige a ese contacto. */
export function linkRecordatorioTurno(
  t: TurnoRecordatorio,
  telefono?: string | null,
) {
  const texto = encodeURIComponent(mensajeRecordatorioTurno(t));
  if (telefono) return `${waLink(telefono)}?text=${texto}`;
  return `https://wa.me/?text=${texto}`;
}
