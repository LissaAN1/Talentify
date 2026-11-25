import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorAuthService {
  generateSecret(email: string) {
    return speakeasy.generateSecret({
      name: `Talentify (${email})`,
      length: 20,
    });
    // Retorna: { base32, otpauth_url, ... }
  }

  async generateQrCodeDataUrl(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
    // Retorna un string "data:image/png;base64,..." listo para el frontend
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1, // tolera aprox 30s de desfase de reloj entre cliente y servidor (RECOMENDADO NO NECESARIO)
    });
  }
}
