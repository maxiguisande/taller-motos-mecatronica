import Link from "next/link";
import { DollarSign, TrendingUp, AlertCircle, Check, Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { marcarPagado } from "@/app/(app)/ordenes/actions";
import { formatMoneda, formatFecha, formatOrdenNumero, toDateInput } from "@/lib/format";
import { sumarTotales, type Totales } from "@/lib/orden";
import { MEDIOS_PAGO, ESTADO_PAGO_COLOR, ESTADO_PAGO_LABEL, MEDIO_PAGO_LABEL } from "@/lib/constants";

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

/** Monto compacto en una línea (para las filas de la lista de cobros). */
function MontoInline({ t }: { t: Totales }) {
  return (
    <span className="whitespace-nowrap text-right">
      {t.ARS !== 0 && <span>{formatMoneda(t.ARS, "ARS")}</span>}
      {t.ARS !== 0 && t.USD !== 0 && " · "}
      {t.USD !== 0 && <span>{formatMoneda(t.USD, "USD")}</span>}
      {t.ARS === 0 && t.USD === 0 && <span>{formatMoneda(0, "ARS")}</span>}
    </span>
  );
}

function parseFecha(s: string | undefined, fallback: Date): Date {
  if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return fallback;
}

export default async function CajaPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const now = new Date();
  const desdeDef = new Date(now.getFullYear(), now.getMonth(), 1);
  const hastaDef = new Date(now.getFullYear(), now.getMonth() + 1, 0); // último día del mes
  const desde = parseFecha(sp.desde, desdeDef);
  const hasta = parseFecha(sp.hasta, hastaDef);
  const inicio = desde;
  const fin = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate() + 1); // hasta inclusive

  const [ordenes, deudas] = await Promise.all([
    prisma.ordenTrabajo.findMany({
      where: { fecha: { gte: inicio, lt: fin } },
      select: {
        id: true,
        numero: true,
        fecha: true,
        totalArs: true,
        totalUsd: true,
        estadoPago: true,
        medioPago: true,
        cliente: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fecha: "desc" },
    }),
    prisma.ordenTrabajo.findMany({
      where: { estadoPago: { in: ["pendiente", "parcial"] } },
      include: { cliente: true },
      orderBy: { fecha: "desc" },
      take: 30,
    }),
  ]);

  const facturado = ordenes.reduce((a, o) => sumarTotales(a, totalDe(o)), CERO);
  const cobrado = ordenes
    .filter((o) => o.estadoPago === "pagado")
    .reduce((a, o) => sumarTotales(a, totalDe(o)), CERO);
  const pendientePeriodo: Totales = {
    ARS: facturado.ARS - cobrado.ARS,
    USD: facturado.USD - cobrado.USD,
  };
  const deudaTotal = deudas.reduce((a, o) => sumarTotales(a, totalDe(o)), CERO);

  const porMedio = MEDIOS_PAGO.map((m) => ({
    label: m.label,
    monto: ordenes
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
            <label className="text-xs font-medium text-slate-500">
              Desde
              <Input type="date" name="desde" defaultValue={toDateInput(desde)} className="mt-0.5 h-9" />
            </label>
            <label className="text-xs font-medium text-slate-500">
              Hasta
              <Input type="date" name="hasta" defaultValue={toDateInput(hasta)} className="mt-0.5 h-9" />
            </label>
            <Button type="submit" size="sm" variant="outline">
              Ver
            </Button>
          </form>
        }
      />

      <p className="mb-3 text-sm text-slate-600">
        Período: <span className="font-medium">{formatFecha(desde)}</span> al{" "}
        <span className="font-medium">{formatFecha(hasta)}</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <DollarSign className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-slate-500">Facturado</p>
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
              <p className="text-sm text-slate-500">Cobrado</p>
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
              <p className="text-sm text-slate-500">Pendiente</p>
              <Montos t={pendientePeriodo} color="text-red-700" />
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
              <p className="text-sm text-slate-400">Sin cobros registrados en el período.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {porMedio.map((m) => (
                  <li key={m.label} className="flex justify-between gap-4 text-slate-700">
                    <span>{m.label}</span>
                    <span className="font-medium text-slate-900">
                      <MontoInline t={m.monto} />
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
              <MontoInline t={deudaTotal} />
            </span>
          </CardHeader>
          <CardBody className="p-0">
            {deudas.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-400">
                No hay órdenes pendientes de cobro. ¡Todo al día! 🎉
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {deudas.map((o) => (
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
                    <span className="shrink-0 text-sm font-medium text-slate-900">
                      <MontoInline t={totalDe(o)} />
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
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Cobros / movimientos del período */}
      <div className="mt-6">
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Cobros del período</h2>
            <span className="ml-auto text-sm text-slate-500">{ordenes.length} orden(es)</span>
          </CardHeader>
          <CardBody className="p-0">
            {ordenes.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-400">
                No hay órdenes en este período.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {ordenes.map((o) => (
                  <Link
                    key={o.id}
                    href={`/ordenes/${o.id}`}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50"
                  >
                    <span className="w-20 shrink-0 text-xs text-slate-500">
                      {formatFecha(o.fecha)}
                    </span>
                    <span className="w-12 shrink-0 text-sm font-bold text-slate-400">
                      {formatOrdenNumero(o.numero)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                      {o.cliente.apellido}, {o.cliente.nombre}
                    </span>
                    <Badge className={ESTADO_PAGO_COLOR[o.estadoPago] ?? "bg-slate-100 text-slate-700 ring-slate-600/20"}>
                      {ESTADO_PAGO_LABEL[o.estadoPago] ?? o.estadoPago}
                      {o.medioPago ? ` · ${MEDIO_PAGO_LABEL[o.medioPago] ?? o.medioPago}` : ""}
                    </Badge>
                    <span className="shrink-0 text-sm font-medium text-slate-900">
                      <MontoInline t={totalDe(o)} />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
