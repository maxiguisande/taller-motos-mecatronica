import { fmtARS, fmtUSD } from "./format";

export type Totales = { ARS: number; USD: number };

type ItemMoneda = {
  precio: number | string | { toString(): string };
  cantidad: number;
  moneda: string;
};

/** Normaliza a "ARS" | "USD" (default ARS). */
export function moneda(m: string | null | undefined): "ARS" | "USD" {
  return m === "USD" ? "USD" : "ARS";
}

/** Suma los ítems (mano de obra + repuestos + manuales) separando por moneda. Sin conversión. */
export function totalesOrden(items: ItemMoneda[]): Totales {
  const t: Totales = { ARS: 0, USD: 0 };
  for (const i of items) {
    t[moneda(i.moneda)] += Number(i.precio) * i.cantidad;
  }
  return t;
}

/** Formatea un total por moneda de forma compacta: "$ 135.000,00" / "US$ 280,00" o ambos. */
export function formatTotales(t: Totales, opts?: { cero?: boolean }): string {
  const partes: string[] = [];
  if (t.ARS !== 0 || (opts?.cero && t.USD === 0)) partes.push(fmtARS.format(t.ARS));
  if (t.USD !== 0) partes.push(fmtUSD.format(t.USD));
  return partes.length ? partes.join("  ·  ") : fmtARS.format(0);
}

/** Suma dos totales (para acumular varias órdenes). */
export function sumarTotales(a: Totales, b: Totales): Totales {
  return { ARS: a.ARS + b.ARS, USD: a.USD + b.USD };
}
