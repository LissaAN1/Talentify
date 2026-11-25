"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";

import { ORDER_STATUS_LABELS, OrderStatus } from "@/interfaces/order";
import type { ReportSummary } from "@/interfaces/report";
import { reportsService } from "@/services/reports.service";
import { formatCurrencyCOP } from "@/lib/format";

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reportsService
      .getSummary()
      .then(setSummary)
      .catch((err) =>
        setError(err.response?.data?.message || "No se pudieron cargar los reportes."),
      )
      .finally(() => setLoading(false));
  }, []);

  const maxRevenue = Math.max(1, ...(summary?.revenueByMonth.map((r) => r.revenue) ?? [0]));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Reportes"
        title="Actividad del marketplace"
        description="Ingresos por mes, servicios más vendidos y órdenes por estado."
      />

      {error && <Alert variant="warning" title="Reportes no disponibles" message={error} />}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : summary ? (
        <>
          <Card>
            <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-500">
              Ingresos por mes (órdenes completadas)
            </h2>

            {summary.revenueByMonth.length === 0 ? (
              <EmptyState title="Sin ingresos todavía" description="Aún no hay órdenes completadas." />
            ) : (
              <ul className="space-y-3">
                {summary.revenueByMonth.map((row) => (
                  <li key={row.month} className="flex items-center gap-4">
                    <span className="w-20 text-sm font-bold text-slate-700">{row.month}</span>
                    <div className="h-3 flex-1 rounded-full bg-slate-100">
                      <div
                        className="h-3 rounded-full bg-green-600"
                        style={{ width: `${(row.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="w-32 text-right text-sm font-black text-slate-950">
                      {formatCurrencyCOP(row.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-500">
              Servicios más vendidos
            </h2>

            {summary.topServices.length === 0 ? (
              <EmptyState title="Sin ventas todavía" description="Aún no hay órdenes completadas." />
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-2">Servicio</th>
                    <th className="py-2">Ventas</th>
                    <th className="py-2 text-right">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topServices.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="py-2 font-bold text-slate-900">{s.title}</td>
                      <td className="py-2">{s.sales}</td>
                      <td className="py-2 text-right">{formatCurrencyCOP(s.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-500">
              Órdenes por mes y estado
            </h2>

            {summary.ordersByMonthAndStatus.length === 0 ? (
              <EmptyState title="Sin órdenes" description="Aún no hay órdenes registradas." />
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-2">Mes</th>
                    <th className="py-2">Estado</th>
                    <th className="py-2 text-right">Órdenes</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.ordersByMonthAndStatus.map((row) => (
                    <tr key={`${row.month}-${row.status}`} className="border-t border-slate-100">
                      <td className="py-2 font-bold text-slate-900">{row.month}</td>
                      <td className="py-2">
                        {ORDER_STATUS_LABELS[row.status as OrderStatus] ?? row.status}
                      </td>
                      <td className="py-2 text-right">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
