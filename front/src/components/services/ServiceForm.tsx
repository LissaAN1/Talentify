'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
    CreateServiceDto,
    Service,
    ServiceCategory,
    serviceCategoryOptions,
    UpdateServiceDto,
} from '@/interfaces/service';

type ServiceFormValues = {
    title: string;
    description: string;
    category: ServiceCategory;
    price: number;
};

interface ServiceFormProps {
    initialValues?: Service | null;
    onSubmit: (dto: CreateServiceDto | UpdateServiceDto) => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
    submitText?: string;
    cancelHref?: string;
}

export function ServiceForm({
                                initialValues,
                                onSubmit,
                                isLoading = false,
                                error = null,
                                submitText = 'Guardar',
                                cancelHref,
                            }: ServiceFormProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ServiceFormValues>({
        defaultValues: {
            title: initialValues?.title ?? '',
            description: initialValues?.description ?? '',
            category: initialValues?.category ?? ('' as ServiceCategory),
            price: initialValues?.price ?? ('' as unknown as number),
        },
    });

    useEffect(() => {
        if (initialValues) {
            reset({
                title: initialValues.title,
                description: initialValues.description,
                category: initialValues.category,
                price: initialValues.price,
            });
        }
    }, [initialValues, reset]);

    const handleFormSubmit = handleSubmit(async (values) => {
        await onSubmit({
            ...values,
            price: Number(values.price),
        });
    });

    return (
        <Card className="space-y-5">
            <form onSubmit={handleFormSubmit} noValidate>
                {error && (
                    <Alert variant="danger" title="No fue posible guardar el servicio" message={error} />
                )}

                <div className="space-y-4">
                    <Input
                        label="Título"
                        {...register('title', {
                            required: 'El título es obligatorio.',
                            minLength: { value: 5, message: 'Mínimo 5 caracteres' },
                            maxLength: { value: 100, message: 'Máximo 100 caracteres' },
                        })}
                        error={errors.title?.message}
                        placeholder="Ej: Diseño de logo profesional"
                        required
                    />

                    <div>
                        <label htmlFor="description" className="mb-2 block text-sm font-bold text-slate-800">
                            Descripción <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                            id="description"
                            rows={4}
                            placeholder="Describe detalladamente el servicio que ofreces..."
                            {...register('description', {
                                required: 'La descripción es obligatoria.',
                                minLength: { value: 10, message: 'Mínimo 10 caracteres' },
                                maxLength: { value: 1000, message: 'Máximo 1000 caracteres' },
                            })}
                        />
                        {errors.description && (
                            <p className="mt-1 text-xs font-medium text-red-600">
                                {errors.description.message}
                            </p>
                        )}
                    </div>
                    
                    <Select
                        label="Categoría"
                        options={[
                            { value: '', label: 'Selecciona una categoría' },
                            ...serviceCategoryOptions,
                        ]}
                        error={errors.category?.message}
                        required
                        {...register('category', { required: 'La categoría es obligatoria.' })}
                    />

                    <Input
                        label="Precio"
                        type="number"
                        min={0}
                        step={1000}
                        placeholder="Ej: 250000"
                        {...register('price', {
                            required: 'El precio es obligatorio.',
                            min: { value: 0, message: 'El precio no puede ser negativo' },
                            valueAsNumber: true,
                        })}
                        error={errors.price?.message}
                        helperText="Precio en pesos colombianos (COP)"
                        required
                    />
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                    {cancelHref && (
                        <Button href={cancelHref} variant="secondary" type="button">
                            Cancelar
                        </Button>
                    )}
                    <Button type="submit" variant="primary" disabled={isLoading}>
                        {isLoading ? 'Guardando...' : submitText}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
