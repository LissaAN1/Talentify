import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/auth.service", () => ({
    authService: {
        generate2FAQR: vi.fn(),
        enable2FA: vi.fn(),
    },
}));

import { useTwoFactorAuth } from "@/hooks/useTwoFactorAuth";
import { authService } from "@/services/auth.service";

describe("useTwoFactorAuth", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("generateQR guarda el código QR devuelto", async () => {
        vi.mocked(authService.generate2FAQR).mockResolvedValue({ qrCode: "data:image/png;base64,qr" });
        const { result } = renderHook(() => useTwoFactorAuth());

        await act(async () => {
            await result.current.generateQR();
        });

        expect(result.current.qrCode).toBe("data:image/png;base64,qr");
        expect(result.current.isLoading).toBe(false);
    });

    it("generateQR apaga el estado de carga aunque falle", async () => {
        vi.mocked(authService.generate2FAQR).mockRejectedValue(new Error("fallo"));
        const { result } = renderHook(() => useTwoFactorAuth());

        await act(async () => {
            await expect(result.current.generateQR()).rejects.toThrow("fallo");
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.qrCode).toBe("");
    });

    it("enable2FA envía el código y devuelve el mensaje", async () => {
        vi.mocked(authService.enable2FA).mockResolvedValue({ mensaje: "2FA habilitado correctamente" });
        const { result } = renderHook(() => useTwoFactorAuth());

        let response;
        await act(async () => {
            response = await result.current.enable2FA("123456");
        });

        expect(authService.enable2FA).toHaveBeenCalledWith({ token: "123456" });
        expect(response).toEqual({ mensaje: "2FA habilitado correctamente" });
    });

    it("enable2FA propaga el error y apaga la carga", async () => {
        vi.mocked(authService.enable2FA).mockRejectedValue(new Error("Código 2FA inválido"));
        const { result } = renderHook(() => useTwoFactorAuth());

        await act(async () => {
            await expect(result.current.enable2FA("000000")).rejects.toThrow("Código 2FA inválido");
        });

        expect(result.current.isLoading).toBe(false);
    });
});
