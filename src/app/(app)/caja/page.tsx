import Link from "next/link";
import { DollarSign, TrendingUp, AlertCircle, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { marcarPagado } from "@/app/(app)/ordenes/actions";
import { formatMoneda, formatFecha, formatOrdenNumero } from "@/lib/format";
import { sumarTotales, type Totales } from "@/lib/orden";
import { MEDIOS_PAGO } from "@/lib/constants";

const CERO: Totales = { ARS: 0, USD: 0 };
const totalDe = (o: { totalArs: unknown; totalUsd: unknown }): Totales => ({
  ARS: Number(o.totalArs),
  USD: Number(o.totalUsd),
});

/** Muestra un monto en pesos y, si corresponde, en dólares debajo. */
function Montos({ t, color = "text-slate-900" }: { t: Totales; color?: string }) {
  const soloUsd = t.ARS === 0 && t.USD !== 0;
  return (
    <div className="min-w-0">
      {!soloUsd && (
        <p className={`truncate text-xl font-bold ${color}`}>{formatMoneda(t.ARS, "ARS")}</p>
      )}
      {t.USD !== 0 && (
        <p className={`truncate font-bold ${soloUsd ? "text-xl" : "text-sm"} ${color}`}>
          {formatMoneda(t.USD, "USD")}
        </p>
      )}
    </div>
  );
}

export default async function CajaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  await requireAdmin();
  const { mes } = await searchParams;

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [y, m] = mes.split("-").map(Number);
    year = y;
    month = m - 1;
  }
  const inicio = new Date(year, month, 1);
  const fin = new Date(year, month + 1, 1);
  const mesValue = `${year}-${String(month + 1).padStart(2, "0")}`;
  const mesLabel = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(inicio);

  const [delMes, deudas] = await Promise.all([
    prisma.ordenTrabajo.findMany({
      where: { fecha: { gte: inicio, lt: fin } },
      select: { totalArs: true, totalUsd: true, estadoPago: true, medioPago: true },
    }),
    prisma.ordenTrabajo.findMany({
      where: { estadoPago: { in: ["pendiente", "parcial"] } },
      include: { cliente: true },
      orderBy: { fecha: "desc" },
      take: 30,
    }),
  ]);

  const facturado = delMes.reduce((a, o) => sumarTotales(a, totalDe(o)), CERO);
  const cobrado = delMes
    .filter((o) => o.estadoPago === "pagado")
    .reduce((a, o) => sumarTotales(a, totalDe(o)), CERO);
  const pendienteMes: Totales = {
    ARS: facturado.ARS - cobrado.ARS,
    USD: facturado.USD - cobrado.USD,
  };
  const deudaTotal = deudas.reduce((a, o) => sumarTotales(a, totalDe(o)), CERO);

  const porMedio = MEDIOS_PAGO.map((m) => ({
    label: m.label,
    monto: delMes
      .filter((o) => o.estadoPago === "pagado" && o.medioPago === m.value)
      .reduce((a, o) => sumarTotales(a, totalDe(o)), CERO),
  })).filter((x) => x.monto.ARS !== 0 || x.monto.USD !== 0);

  return (
    <div>
      <PageHeader
        title="Caja"
        description="Ingresos, cobros y deudas."
        action={
          <form action="/caja" className="flex items-end gap-2">
            <Input type="month" name="mes" defaultValue={mesValue} className="h-9" />
            <Button type="submit" size="sm" variant="outline">
              Ver
            </Button>
          </form>
        }
      />

      <p className="mb-3 text-sm font-medium capitalize text-slate-600">
        {mesLabel}
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <DollarSign className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-slate-500">Facturado del mes</p>
              <Montos t={facturado} />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-slate-500">Cobrado del mes</p>
              <Montos t={cobrado} color="text-emerald-700" />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-slate-500">Pendiente del mes</p>
              <Montos t={pendienteMes} color="text-red-700" />
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Medios de pago */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Cobrado por medio de pago</h2>
          </CardHeader>
          <CardBody>
            {porMedio.length === 0 ? (
              <p className="text-sm text-slate-400">Sin cobros registrados este mes.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {porMedio.map((m) => (
                  <li key={m.label} className="flex justify-between gap-4 text-slate-700">
                    <span>{m.label}</span>
                    <span className="text-right font-medium text-slate-900">
                      {m.monto.ARS !== 0 && <span>{formatMoneda(m.monto.ARS, "ARS")}</span>}
                      {m.monto.ARS !== 0 && m.monto.USD !== 0 && " · "}
                      {m.monto.USD !== 0 && <span>{formatMoneda(m.monto.USD, "USD")}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Deudas */}
        <Card>
          <CardHeader className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-900">Deudas (pendiente de cobro)</h2>
            <span className="text-right text-sm font-bold text-red-700">
              {deudaTotal.ARS !== 0 && <span>{formatMoneda(deudaTotal.ARS, "ARS")}</span>}
              {deudaTotal.ARS !== 0 && deudaTotal.USD !== 0 && " · "}
              {deudaTotal.USD !== 0 && <span>{formatMoneda(deudaTotal.USD, "USD")}</span>}
            </span>
          </CardHeader>
          <CardBody className="p-0">
            {deudas.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-400">
                No hay órdenes pendientes de cobro. ¡Todo al día! 🎉
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {deudas.map((o) => {
                  const t = totalDe(o);
                  return (
                    <div
                      key={o.id}
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50"
                    >
                      <Link
                        href={`/ordenes/${o.id}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <span className="w-12 shrink-0 text-sm font-bold text-slate-400">
                          {formatOrdenNumero(o.numero)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {o.cliente.apellido}, {o.cliente.nombre}
                          </p>
                          <p className="text-xs text-slate-500">{formatFecha(o.fecha)}</p>
                        </div>
                      </Link>
                      <span className="shrink-0 text-right text-sm font-medium text-slate-900">
                        {(t.ARS !== 0 || t.USD === 0) && (
                          <span className="block">{formatMoneda(t.ARS, "ARS")}</span>
                        )}
                        {t.USD !== 0 && (
                          <span className="block">{formatMoneda(t.USD, "USD")}</span>
                        )}
                      </span>
                      <form action={marcarPagado.bind(null, o.id)}>
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="text-emerald-700"
                        >
                          <Check className="h-4 w-4" />
                          Cobrar
                        </Button>
                      </form>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
