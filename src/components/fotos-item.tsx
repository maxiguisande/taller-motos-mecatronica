"use client";

import { useRef, useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";

type Foto = { id: string; url: string };

const MAX = 6;

/** Comprime una imagen a JPEG (máx ~1600px) antes de subirla. */
function comprimir(file: File, max = 1600, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > max || height > max) {
        const s = max / Math.max(width, height);
        width = Math.round(width * s);
        height = Math.round(height * s);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("no blob"))),
        "image/jpeg",
        quality,
      );
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function FotosItem({
  uploadFields,
  fotos: fotosIniciales,
  editable,
}: {
  /** Campos que identifican dónde va la foto: {ordenItemId} o {ordenId, categoria}. */
  uploadFields: Record<string, string>;
  fotos: Foto[];
  editable: boolean;
}) {
  const [fotos, setFotos] = useState<Foto[]>(fotosIniciales);
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
      fd.append("file", blob, "foto.jpg");
      for (const [k, v] of Object.entries(uploadFields)) fd.append(k, v);
      const res = await fetch("/api/fotos", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "No se pudo subir la foto");
      } else {
        const nueva = (await res.json()) as Foto;
        setFotos((f) => [...f, nueva]);
      }
    } catch {
      setError("No se pudo procesar la imagen");
    } finally {
      setSubiendo(false);
    }
  }

  async function borrar(id: string) {
    if (!confirm("¿Borrar esta foto? Esta acción no se puede deshacer.")) return;
    const res = await fetch(`/api/fotos?id=${id}`, { method: "DELETE" });
    if (res.ok) setFotos((f) => f.filter((x) => x.id !== id));
  }

  if (!editable && fotos.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-2">
        {fotos.map((f) => (
          <div key={f.id} className="relative">
            <a href={f.url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.url}
                alt="Foto del trabajo"
                className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
              />
            </a>
            {editable && (
              <button
                type="button"
                onClick={() => borrar(f.id)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow"
                aria-label="Borrar foto"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {editable && fotos.length < MAX && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={subiendo}
            className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-brand-400 hover:text-brand-600 disabled:opacity-50"
          >
            {subiendo ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Camera className="h-5 w-5" />
                <span className="text-[10px]">Foto</span>
              </>
            )}
          </button>
        )}
      </div>

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
