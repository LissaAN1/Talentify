import { Search } from "lucide-react";

type SearchBarProps = {
    value: string;                      // Valor actual del input
    onChange: (value: string) => void;  // Función que actualiza el valor
    placeholder?: string;               // Texto guía de ayuda (opcional)
};

export function SearchBar({ value, onChange, placeholder = "Buscar..." }: SearchBarProps) {
    return (
        <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            
            <input
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-950
                        outline-none transition placeholder:text-slate-400 focus:tf-focus"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            />
        </div>
    );
}
