import Link from "next/link";
import { Star, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Service } from "@/interfaces/service";
import { formatCurrencyCOP } from "@/lib/format";

type ServiceCardProps = {
    service: Service;
};

export function ServiceCard({ service }: ServiceCardProps) {
    return (
        <article className="tf-card overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
            <div className="h-36 bg-gradient-to-br from-[#052e16] via-green-800 to-green-500 p-5 text-white">
                <Badge variant="success" className="bg-white/95">
                    {service.category}
                </Badge>

                <h3 className="mt-5 line-clamp-2 text-xl font-black leading-tight">
                    {service.title}
                </h3>
            </div>

            <div className="p-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                        <UserRound className="h-5 w-5" />
                    </div>

                    <div>
                        <p className="text-sm font-black text-slate-950">
                            {service.provider?.name ?? "Proveedor Talentify"}
                        </p>
                        <p className="flex items-center gap-1 text-xs font-bold text-slate-500">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            4.8 · Verificado
                        </p>
                    </div>
                </div>

                <p className="mt-4 line-clamp-3 min-h-16 text-sm leading-6 text-slate-600">
                    {service.description}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                        <p className="text-xs font-bold text-slate-500">Desde</p>
                        <p className="text-lg font-black text-slate-950">
                            {formatCurrencyCOP(service.price)}
                        </p>
                    </div>

                    <Link
                        href={`/services/${service.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-green-600 bg-green-600 px-3 text-sm font-bold text-white transition hover:bg-green-700"
                    >
                        Ver detalle
                    </Link>
                </div>
            </div>
        </article>
    );
}
