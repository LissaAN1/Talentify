'use client';

import { useState } from 'react';
import { authService } from '@/services/auth.service';

export const useTwoFactorAuth = () => {
    const [qrCode, setQrCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const generateQR = async () => {
        setIsLoading(true);

        try {
            const response = await authService.generate2FAQR();
            setQrCode(response.qrCode);
            return response.qrCode;
        } finally {
            setIsLoading(false);
        }
    };

    const enable2FA = async (token: string) => {
        setIsLoading(true);

        try {
            return await authService.enable2FA({ token });
        } finally {
            setIsLoading(false);
        }
    };

    return { qrCode, isLoading, generateQR, enable2FA, };
};
