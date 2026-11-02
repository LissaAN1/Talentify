import { Badge } from "@/components/ui/Badge";
import { AppRoles, roleLabels } from "@/constants/app-roles";

// Los tipos "success", "blue" y "neutral" corresponden a las variantes de nuestro componente Badge.tsx:

const roleVariant: Record<AppRoles, "success" | "blue" | "neutral"> = {
    [AppRoles.ADMIN]: "blue",
    [AppRoles.PROVIDER]: "success",
    [AppRoles.CLIENT]: "neutral",
};

export function UserRoleBadges({ roles }: { roles: AppRoles[] }) {
    if (!roles || roles.length === 0) {
        return <Badge variant="neutral">Sin roles</Badge>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
                <Badge key={role} variant={roleVariant[role] ?? "neutral"}>
                    {roleLabels[role] ?? role}
                </Badge>
            ))}
        </div>
    );
}
