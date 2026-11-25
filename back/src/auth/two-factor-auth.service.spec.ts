import type { Mock } from 'vitest';
import * as QRCode from 'qrcode';
import * as speakeasy from 'speakeasy';

import { TwoFactorAuthService } from './two-factor-auth.service';

vi.mock('speakeasy', () => ({
  generateSecret: vi.fn(),
  totp: {
    verify: vi.fn(),
  },
}));

vi.mock('qrcode', () => ({
  toDataURL: vi.fn(),
}));

describe('TwoFactorAuthService', () => {
  let service: TwoFactorAuthService;

  beforeEach(() => {
    service = new TwoFactorAuthService();
    vi.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('generateSecret', () => {
    it('debe generar un secret 2FA usando el correo del usuario', () => {
      const secret = {
        base32: 'SECRET_BASE32',
        otpauth_url: 'otpauth://totp/Talentify',
      };

      (speakeasy.generateSecret as Mock).mockReturnValue(secret);

      const result = service.generateSecret('test@u.icesi.edu.co');

      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: 'Talentify (test@u.icesi.edu.co)',
        length: 20,
      });
      expect(result).toEqual(secret);
    });
  });

  describe('generateQrCodeDataUrl', () => {
    it('debe generar un QR en formato data URL', async () => {
      (QRCode.toDataURL as Mock).mockResolvedValue('data:image/png;base64,QR');

      const result = await service.generateQrCodeDataUrl(
        'otpauth://totp/Talentify',
      );

      expect(QRCode.toDataURL).toHaveBeenCalledWith('otpauth://totp/Talentify');
      expect(result).toBe('data:image/png;base64,QR');
    });
  });

  describe('verifyToken', () => {
    it('debe retornar true cuando el token 2FA es válido', () => {
      (speakeasy.totp.verify as Mock).mockReturnValue(true);

      const result = service.verifyToken('SECRET_BASE32', '123456');

      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'SECRET_BASE32',
        encoding: 'base32',
        token: '123456',
        window: 1,
      });
      expect(result).toBe(true);
    });

    it('debe retornar false cuando el token 2FA es inválido', () => {
      (speakeasy.totp.verify as Mock).mockReturnValue(false);

      const result = service.verifyToken('SECRET_BASE32', '000000');

      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'SECRET_BASE32',
        encoding: 'base32',
        token: '000000',
        window: 1,
      });
      expect(result).toBe(false);
    });
  });
});
