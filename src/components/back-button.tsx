"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Botón "Volver": vuelve a la pantalla anterior (o a un fallback si no hay historial). */
export function BackButton({
  fallback = "/",
  label = "Volver",
}: {
  fallback?: string;
  label?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
