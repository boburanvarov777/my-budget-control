import {
  deriveWebhookSecret,
  isValidWebhookSecret,
} from './webhook-secret.util';

const BOT_TOKEN = '123456:TEST-TOKEN';
const OTHER_TOKEN = '654321:OTHER-TOKEN';

describe('deriveWebhookSecret', () => {
  it('is deterministic for the same bot token', () => {
    expect(deriveWebhookSecret(BOT_TOKEN)).toBe(deriveWebhookSecret(BOT_TOKEN));
  });

  it('differs for a different bot token', () => {
    expect(deriveWebhookSecret(BOT_TOKEN)).not.toBe(
      deriveWebhookSecret(OTHER_TOKEN),
    );
  });

  it('is a 64 character token accepted by the Telegram API', () => {
    const secret = deriveWebhookSecret(BOT_TOKEN);
    expect(secret).toHaveLength(64);
    expect(secret).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('returns null without a bot token', () => {
    expect(deriveWebhookSecret('')).toBeNull();
  });
});

describe('isValidWebhookSecret', () => {
  it('accepts the secret derived from our own bot token', () => {
    const secret = deriveWebhookSecret(BOT_TOKEN)!;
    expect(isValidWebhookSecret(BOT_TOKEN, secret)).toBe(true);
  });

  it('rejects a missing or empty header', () => {
    expect(isValidWebhookSecret(BOT_TOKEN, undefined)).toBe(false);
    expect(isValidWebhookSecret(BOT_TOKEN, '')).toBe(false);
  });

  it('rejects a wrong secret of the same length', () => {
    expect(isValidWebhookSecret(BOT_TOKEN, 'a'.repeat(64))).toBe(false);
  });

  it('rejects a secret of the wrong length without throwing', () => {
    expect(isValidWebhookSecret(BOT_TOKEN, 'short')).toBe(false);
    expect(isValidWebhookSecret(BOT_TOKEN, 'x'.repeat(200))).toBe(false);
  });

  it("rejects another bot's secret", () => {
    const theirs = deriveWebhookSecret(OTHER_TOKEN)!;
    expect(isValidWebhookSecret(BOT_TOKEN, theirs)).toBe(false);
  });

  it('rejects everything when no bot token is configured', () => {
    expect(isValidWebhookSecret(undefined, 'anything')).toBe(false);
    expect(isValidWebhookSecret('', '')).toBe(false);
  });
});
