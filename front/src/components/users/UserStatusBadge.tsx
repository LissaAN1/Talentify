import { Badge } from "@/components/ui/Badge";

// Los tipos "success" y "danger" corresponden a las variantes de nuestro componente Badge.tsx:

export function UserStatusBadge({ isActive }: { isActive: boolean }) {
    return (
        <Badge variant={isActive ? "success" : "danger"}>
            {isActive ? "Activo" : "Inactivo"}
        </Badge>
    );
}
