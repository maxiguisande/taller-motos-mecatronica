"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

/**
 * Muestra un toast de confirmación cuando la URL trae ?ok=... (los server
 * actions redirigen con ese parámetro tras guardar/borrar). Luego lo limpia.
 */
export function FlashToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const ok = params.get("ok");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!ok) return;
    setMsg(ok === "1" ? "Guardado" : ok);

    const p = new URLSearchParams(Array.from(params.entries()));
    p.delete("ok");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok]);

  if (!msg) return null;

  return (
    <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 print:hidden">
      <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
        <CheckCircle2 className="h-4 w-4 text-brand-400" />
        {msg}
      </div>
    </div>
  );
}
