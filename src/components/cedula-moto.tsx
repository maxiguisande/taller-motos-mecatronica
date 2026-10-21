"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { comprimir } from "@/lib/imagen";

/**
 * Cédula de la moto: muestra la guardada en la ficha de la moto y permite
 * sacar/cargar una nueva, que reemplaza (pisa) a la anterior.
 */
export function CedulaMoto({
  motoId,
  cedulaUrl,
}: {
  motoId: string;
  cedulaUrl: string | null;
}) {
  const [url, setUrl] = useState(cedulaUrl);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setSubiendo(true);
    try {
      const blob = await comprimir(file);
      const fd = new FormData();
      fd.append("file", blob, "cedula.jpg");
      fd.append("motoId", motoId);
      const res = await fetch("/api/cedula-moto", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "No se pudo subir la cédula");
      } else {
        const { url: nueva } = (await res.json()) as { url: string };
        setUrl(nueva);
      }
    } catch {
      setError("No se pudo procesar la imagen");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-slate-600">Cédula de la moto</p>
      <div className="flex flex-wrap items-center gap-3">
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" title="Ver cédula">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Cédula de la moto"
              className="h-20 w-32 rounded-lg border border-slate-200 object-cover"
            />
          </a>
        ) : (
          <p className="text-sm text-slate-400">Sin cédula cargada.</p>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:border-brand-400 hover:text-brand-700 disabled:opacity-50"
        >
          {subiendo ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          {url ? "Cargar una nueva" : "Sacar foto de la cédula"}
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Queda guardada en la ficha de la moto; si cargás una nueva, reemplaza a la anterior.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        className="hidden"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
