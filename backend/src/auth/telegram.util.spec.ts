import * as crypto from 'crypto';
import {
  normalizePhone,
  phonesMatch,
  usernamesMatch,
  validateTelegramInitData,
} from './telegram.util';

const BOT_TOKEN = '123456:TEST-TOKEN';

/** Builds a valid initData string the same way Telegram does. */
function signInitData(
  params: Record<string, string>,
  botToken = BOT_TOKEN,
): string {
  const dataCheckString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const search = new URLSearchParams({ ...params, hash });
  return search.toString();
}

function freshParams(overrides: Record<string, string> = {}) {
  return {
    auth_date: String(Math.floor(Date.now() / 1000)),
    query_id: 'AAA',
    user: JSON.stringify({ id: 42, first_name: 'Bobur', username: 'bobur' }),
    ...overrides,
  };
}

describe('normalizePhone', () => {
  it('produces the same canonical value for every formatting Telegram uses', () => {
    const expected = '+998997162616';
    expect(normalizePhone('+998997162616')).toBe(expected);
    expect(normalizePhone('998997162616')).toBe(expected);
    expect(normalizePhone('+998 99 716 26 16')).toBe(expected);
    expect(normalizePhone('+998-99-716-26-16')).toBe(expected);
    expect(normalizePhone('(998) 99 716 26 16')).toBe(expected);
  });

  it('returns an empty string when there are no digits', () => {
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone('   ')).toBe('');
  });
});

describe('phonesMatch', () => {
  it('matches numbers that differ only in formatting', () => {
    expect(phonesMatch('998997162616', '+998 99 716 26 16')).toBe(true);
  });

  it('does not match different numbers', () => {
    expect(phonesMatch('+998997162616', '+998997162617')).toBe(false);
  });

  it('never matches two empty values', () => {
    expect(phonesMatch('', '')).toBe(false);
  });
});

describe('usernamesMatch', () => {
  it('is case insensitive', () => {
    expect(usernamesMatch('Anvarov_Bobur', 'anvarov_bobur')).toBe(true);
  });

  it('is false when either side is missing', () => {
    expect(usernamesMatch(null, 'anvarov_bobur')).toBe(false);
    expect(usernamesMatch('anvarov_bobur', null)).toBe(false);
  });
});

describe('validateTelegramInitData', () => {
  it('accepts data signed with the real bot token', () => {
    const user = validateTelegramInitData(
      signInitData(freshParams()),
      BOT_TOKEN,
    );
    expect(user?.id).toBe(42);
    expect(user?.username).toBe('bobur');
  });

  it('rejects data signed with a different bot token', () => {
    const initData = signInitData(freshParams(), 'other:TOKEN');
    expect(validateTelegramInitData(initData, BOT_TOKEN)).toBeNull();
  });

  it('rejects data whose fields were tampered with after signing', () => {
    const initData = signInitData(freshParams());
    const tampered = new URLSearchParams(initData);
    tampered.set('user', JSON.stringify({ id: 999, first_name: 'Hacker' }));
    expect(validateTelegramInitData(tampered.toString(), BOT_TOKEN)).toBeNull();
  });

  it('rejects data older than 24 hours', () => {
    const stale = String(Math.floor(Date.now() / 1000) - 86_401);
    const initData = signInitData(freshParams({ auth_date: stale }));
    expect(validateTelegramInitData(initData, BOT_TOKEN)).toBeNull();
  });

  it('rejects missing hash, missing user and empty input', () => {
    expect(validateTelegramInitData('', BOT_TOKEN)).toBeNull();
    expect(validateTelegramInitData('user=%7B%7D', BOT_TOKEN)).toBeNull();

    const noUser = signInitData({
      auth_date: String(Math.floor(Date.now() / 1000)),
      query_id: 'AAA',
    });
    expect(validateTelegramInitData(noUser, BOT_TOKEN)).toBeNull();
  });

  it('rejects everything when no bot token is configured', () => {
    expect(
      validateTelegramInitData(signInitData(freshParams()), ''),
    ).toBeNull();
  });
});
