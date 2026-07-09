import Link from "next/link";
import { DollarSign, TrendingUp, AlertCircle, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { formatMoneda, formatFecha, formatOrdenNumero } from "@/lib/format";
import {
  MEDIOS_PAGO,
  MEDIO_PAGO_LABEL,
  ESTADO_PAGO_COLOR,
  ESTADO_PAGO_LABEL,
} from "@/lib/constants";

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
      select: { total: true, estadoPago: true, medioPago: true },
    }),
    prisma.ordenTrabajo.findMany({
      where: { estadoPago: { in: ["pendiente", "parcial"] } },
      include: { cliente: true },
      orderBy: { fecha: "desc" },
      take: 30,
    }),
  ]);

  const facturado = delMes.reduce((a, o) => a + Number(o.total), 0);
  const cobrado = delMes
    .filter((o) => o.estadoPago === "pagado")
    .reduce((a, o) => a + Number(o.total), 0);
  const pendienteMes = facturado - cobrado;
  const deudaTotal = deudas.reduce((a, o) => a + Number(o.total), 0);

  const porMedio = MEDIOS_PAGO.map((m) => ({
    label: m.label,
    monto: delMes
      .filter((o) => o.estadoPago === "pagado" && o.medioPago === m.value)
      .reduce((a, o) => a + Number(o.total), 0),
  })).filter((x) => x.monto > 0);

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
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <DollarSign className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-slate-500">Facturado del mes</p>
              <p className="truncate text-xl font-bold text-slate-900">
                {formatMoneda(facturado)}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-slate-500">Cobrado del mes</p>
              <p className="truncate text-xl font-bold text-emerald-700">
                {formatMoneda(cobrado)}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-slate-500">Pendiente del mes</p>
              <p className="truncate text-xl font-bold text-red-700">
                {formatMoneda(pendienteMes)}
              </p>
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
                  <li key={m.label} className="flex justify-between text-slate-700">
                    <span>{m.label}</span>
                    <span className="font-medium text-slate-900">
                      {formatMoneda(m.monto)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Deudas */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Deudas (pendiente de cobro)</h2>
            <span className="text-sm font-bold text-red-700">
              {formatMoneda(deudaTotal)}
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
                  <Link
                    key={o.id}
                    href={`/ordenes/${o.id}`}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50"
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
                    <Badge
                      className={
                        ESTADO_PAGO_COLOR[o.estadoPago] ??
                        "bg-slate-100 text-slate-700 ring-slate-600/20"
                      }
                    >
                      {ESTADO_PAGO_LABEL[o.estadoPago] ?? o.estadoPago}
                    </Badge>
                    <span className="shrink-0 text-sm font-medium text-slate-900">
                      {formatMoneda(o.total)}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
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
