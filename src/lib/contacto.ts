/** Deja solo los dígitos de un teléfono. */
export function soloDigitos(t: string) {
  return t.replace(/\D/g, "");
}

/** Link wa.me a partir de un teléfono argentino (agrega 549 si hace falta). */
export function waLink(telefono: string) {
  let d = soloDigitos(telefono);
  if (d && !d.startsWith("54")) d = "549" + d;
  return `https://wa.me/${d}`;
}

/** Tipos de contacto que representan un teléfono. */
export function esTelefono(tipo: string) {
  return tipo === "celular" || tipo === "fijo" || tipo === "whatsapp";
}

/** Tipos de contacto a los que se les puede escribir por WhatsApp. */
export function esWhatsApp(tipo: string) {
  return tipo === "celular" || tipo === "whatsapp";
}
