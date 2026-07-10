"use client";

import { useEffect } from "react";

/**
 * Avisa antes de cerrar/recargar/salir de la página si hay cambios sin guardar.
 * Se activa pasando `active={true}` (por ejemplo, cuando el formulario está "sucio").
 */
export function UnsavedGuard({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);
  return null;
}
