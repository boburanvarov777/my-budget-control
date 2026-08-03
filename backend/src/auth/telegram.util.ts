import * as crypto from 'crypto';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export function validateTelegramInitData(
  initData: string,
  botToken: string,
): TelegramUser | null {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calculatedHash !== hash) return null;

  const authDate = Number(params.get('auth_date'));
  if (Number.isNaN(authDate)) return null;

  const maxAgeSeconds = 86400;
  if (Math.floor(Date.now() / 1000) - authDate > maxAgeSeconds) return null;

  const userRaw = params.get('user');
  if (!userRaw) return null;

  try {
    return JSON.parse(userRaw) as TelegramUser;
  } catch {
    return null;
  }
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '');
}

export function phonesMatch(a: string, b: string): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (na === nb) return true;
  const stripPlus = (p: string) => p.replace(/^\+/, '');
  return stripPlus(na) === stripPlus(nb);
}

export function usernamesMatch(
  actual?: string | null,
  expected?: string | null,
): boolean {
  if (!expected) return false;
  const normalizedExpected = expected.replace(/^@/, '').toLowerCase();
  const normalizedActual = (actual ?? '').replace(/^@/, '').toLowerCase();
  return normalizedActual === normalizedExpected;
}

export function looksLikePhone(text: string): boolean {
  const digits = text.replace(/\D/g, '');
  if (digits.length < 9) return false;
  return /^\+?\d[\d\s\-()]{8,}$/.test(text.trim());
}
