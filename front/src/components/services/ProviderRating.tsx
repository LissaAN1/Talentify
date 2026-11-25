"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

import type { ProviderRatingSummary } from "@/interfaces/rating";
import { ratingsService } from "@/services/ratings.service";

// Muestra el promedio real del proveedor (reemplaza el «4.8» fijo de la tarjeta).
export function ProviderRating({ providerId }: { providerId: string }) {
  const [summary, setSummary] = useState<ProviderRatingSummary | null>(null);

  useEffect(() => {
    let active = true;

    ratingsService
      .getProviderSummary(providerId)
      .then((data) => active && setSummary(data))
      .catch(() => active && setSummary(null));

    return () => {
      active = false;
    };
  }, [providerId]);

  if (!summary || summary.count === 0) {
    return <span className="text-xs font-semibold text-slate-500">Sin calificaciones</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      {summary.average.toFixed(1)} · {summary.count}{" "}
      {summary.count === 1 ? "calificación" : "calificaciones"}
    </span>
  );
}
