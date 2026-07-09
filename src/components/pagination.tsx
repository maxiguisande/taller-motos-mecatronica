import { ChevronLeft, ChevronRight } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between gap-2">
      {page > 1 ? (
        <LinkButton href={hrefFor(page - 1)} variant="outline" size="sm">
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </LinkButton>
      ) : (
        <span />
      )}
      <span className="text-sm text-slate-500">
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <LinkButton href={hrefFor(page + 1)} variant="outline" size="sm">
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </LinkButton>
      ) : (
        <span />
      )}
    </div>
  );
}
