/** Skeleton genérico mientras carga cualquier sección (mejora la sensación de velocidad). */
export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Encabezado */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded bg-slate-200" />
          <div className="h-4 w-64 rounded bg-slate-100" />
        </div>
        <div className="h-9 w-32 shrink-0 rounded-lg bg-slate-200" />
      </div>

      {/* Listado */}
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-100" />
            </div>
            <div className="h-6 w-20 shrink-0 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
