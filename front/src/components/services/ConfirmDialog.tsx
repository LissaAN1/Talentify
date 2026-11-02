'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
}

export function ConfirmDialog({
                                  open,
                                  title,
                                  description,
                                  confirmText = 'Confirmar',
                                  cancelText = 'Cancelar',
                                  isLoading = false,
                                  onConfirm,
                                  onCancel,
                              }: ConfirmDialogProps) {
    // Bloquea el scroll del body mientras el modal está abierto
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!open) return null;

    return (
        // Backdrop: cubre toda la pantalla
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
            onClick={onCancel}
            role="presentation"
        >
            {/* Panel del diálogo: detiene la propagación del clic del backdrop */}
            <div
                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
            >
                <div className="p-6 space-y-3">
                    <h2
                        id="confirm-dialog-title"
                        className="text-xl font-black text-slate-950"
                    >
                        {title}
                    </h2>
                    {description && (
                        <p className="text-sm leading-6 text-slate-600">{description}</p>
                    )}
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Procesando...' : confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}
