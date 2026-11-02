'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchBar } from '@/components/marketplace/SearchBar';
import { ServiceCard } from '@/components/marketplace/ServiceCard';
import { useServices } from '@/hooks/useServices';
import { CATEGORY_LABELS, ServiceCategory } from '@/interfaces/service';
import {
    Code2,
    Megaphone,
    PenLine,
    Camera,
    Video,
    Palette,
    type LucideIcon,
} from 'lucide-react';

const CATEGORY_ICONS: Record<ServiceCategory, LucideIcon> = {
    [ServiceCategory.DESIGN]: Palette,
    [ServiceCategory.PROGRAMMING]: Code2,
    [ServiceCategory.MARKETING]: Megaphone,
    [ServiceCategory.WRITING]: PenLine,
    [ServiceCategory.PHOTOGRAPHY]: Camera,
    [ServiceCategory.VIDEO]: Video,
};

const CATEGORIES = Object.values(ServiceCategory).map((value) => ({
    value,
    label: CATEGORY_LABELS[value],
    icon: CATEGORY_ICONS[value],
}));

function ServiceGridSkeleton() {
    return (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
                >
                    <Skeleton className="h-5 w-34" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-8 w-24" />
                </div>
            ))}
        </div>
    );
}

export default function MarketplacePage() {
    const { services, isLoading, error } = useServices();
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(null);

    const activeServices = services.filter((s) => s.isActive);

    const filtered = activeServices.filter((service) => {
        const matchesSearch =
            !search ||
            service.title.toLowerCase().includes(search.toLowerCase()) ||
            service.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = !activeCategory || service.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-8">
            <PageHeader
                eyebrow="Marketplace"
                title="Explora servicios"
                description="Descubre los servicios disponibles ofrecidos por nuestros proveedores."
            />

            <SearchBar value={search} onChange={setSearch} placeholder="Buscar por título o descripción..." />

            {/* Filtros por categoría */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setActiveCategory(null)}
                    className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                        !activeCategory
                            ? 'bg-green-700 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    Todos
                </button>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.value}
                        onClick={() =>
                            setActiveCategory(activeCategory === cat.value ? null : cat.value)
                        }
                        className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                            activeCategory === cat.value
                                ? 'bg-green-700 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Resultados */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-950">
                        {activeCategory
                            ? CATEGORY_LABELS[activeCategory]
                            : search
                                ? `Resultados para "${search}"`
                                : 'Todos los servicios'}
                    </h2>
                    {!isLoading && (
                        <Badge variant="neutral">
                            {filtered.length} servicio{filtered.length !== 1 ? 's' : ''}
                        </Badge>
                    )}
                </div>

                {error && (
                    <Alert
                        variant="danger"
                        title="No fue posible cargar el marketplace"
                        message={error}
                    />
                )}

                {isLoading ? (
                    <ServiceGridSkeleton />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        title="No encontramos servicios"
                        description="No se encontraron servicios con los filtros aplicados."
                        action={
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setSearch('');
                                    setActiveCategory(null);
                                }}
                            >
                                Limpiar filtros
                            </Button>
                        }
                    />
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {filtered.map((service) => (
                            <ServiceCard key={service.id} service={service} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
