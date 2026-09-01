"use client";

import { useEffect } from "react";

/**
 * Abre solo el diálogo de imprimir/guardar PDF al llegar a la página (se
 * renderiza cuando viene ?print=1), esperando a que cargue todo (fotos
 * incluidas) para que no salgan en blanco.
 */
export function AutoPrint() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const imprimir = () => {
      timer = setTimeout(() => window.print(), 300);
    };
    if (document.readyState === "complete") imprimir();
    else window.addEventListener("load", imprimir, { once: true });
    return () => {
      window.removeEventListener("load", imprimir);
      if (timer) clearTimeout(timer);
    };
  }, []);
  return null;
}
