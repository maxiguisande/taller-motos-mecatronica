"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Botón de borrado que pide confirmación antes de ejecutar el server action.
 * Uso: <DeleteButton action={borrarAlgo.bind(null, id)} mensaje="..." />
 */
export function DeleteButton({
  action,
  mensaje = "¿Seguro que querés eliminar este registro? Esta acción no se puede deshacer.",
  label,
}: {
  action: () => Promise<void>;
  mensaje?: string;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(mensaje)) e.preventDefault();
      }}
    >
      <Button
        type="submit"
        variant={label ? "danger" : "ghost"}
        size={label ? "sm" : "icon"}
        className={label ? undefined : "text-slate-400 hover:text-red-600"}
        title="Eliminar"
      >
        <Trash2 className="h-4 w-4" />
        {label}
      </Button>
    </form>
  );
}
