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

/**
 * Canonical phone format: digits only, always prefixed with "+".
 *
 * Telegram sends contact.phone_number sometimes as "998901234567" and
 * sometimes as "+998 90 123 45 67". Storing the raw value meant the same
 * number could sit in two rows and the "phone already taken" check would
 * silently miss it, so everything is normalised through here before it
 * touches the database.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits ? `+${digits}` : '';
}

export function phonesMatch(a: string, b: string): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  return na !== '' && na === nb;
}

export function usernamesMatch(
  actual?: string | null,
  expected?: string | null,
): boolean {
  if (!expected) return false;
  return (actual ?? '').toLowerCase() === expected.toLowerCase();
}
