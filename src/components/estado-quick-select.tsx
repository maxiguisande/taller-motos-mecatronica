"use client";

import { useRef } from "react";

/**
 * Select compacto para cambiar el estado de un registro directamente desde un
 * listado. Al elegir una opción, envía el server action `action` (que lee el
 * campo "estado" del FormData).
 */
export function EstadoQuickSelect({
  estados,
  value,
  action,
  title = "Cambiar estado",
}: {
  estados: readonly { value: string; label: string }[];
  value: string;
  action: (fd: FormData) => void | Promise<void>;
  title?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form action={action} ref={formRef}>
      <select
        name="estado"
        defaultValue={value}
        title={title}
        onChange={() => formRef.current?.requestSubmit()}
        className="h-7 rounded-md border border-slate-300 bg-white px-1.5 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      >
        {estados.map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </select>
    </form>
  );
}
