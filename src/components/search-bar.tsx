import { Search } from "lucide-react";

/** Buscador simple basado en query string (?q=). Funciona sin JS. */
export function SearchBar({
  placeholder = "Buscar…",
  defaultValue,
  action,
}: {
  placeholder?: string;
  defaultValue?: string;
  action: string;
}) {
  return (
    <form action={action} className="relative max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      />
    </form>
  );
}
