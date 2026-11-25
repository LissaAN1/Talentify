import {LucideIcon} from "lucide-react";

type CategoryCardProps = {
    title: string,
    description: string,
    icon: LucideIcon,
    onClick?: () => void
};

export function CategoryCard({title, description, icon: Icon, onClick}: CategoryCardProps) {
    return (
        <article className="tf-card group p-6 transition hover:-translate-y-1 hover:border-green-200 hover:shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <Icon className="h-6 w-6"/>
            </div>

            <h3 className="mt-5 text-lg font-black text-slate-950 group-hover:text-green-700">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </article>
    );
}
