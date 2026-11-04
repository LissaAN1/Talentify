"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader";
import { UserForm } from "@/components/users/UserForm";

import { CreateUserDto } from "@/interfaces/user";
import { usersService } from "@/services/users.service";

export default function NewUserPage() {
    const router = useRouter();

    const handleSubmit = async (values: CreateUserDto) => {
        await usersService.create(values);
        router.push("/users");
    };

    return (
        <div className="space-y-8">
            <PageHeader
                eyebrow="Usuarios"
                title="Crear usuario"
                description="Registra un nuevo usuario y asigna sus roles iniciales."
            />

            <UserForm
                mode="create"
                submitLabel="Crear usuario"
                onSubmit={(values) => handleSubmit(values as CreateUserDto)}
            />
        </div>
    );
}
