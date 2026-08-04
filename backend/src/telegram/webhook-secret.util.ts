import * as crypto from 'crypto';

/**
 * Telegram lets us register a secret token with setWebhook and echoes it back
 * in the X-Telegram-Bot-Api-Secret-Token header on every update.
 *
 * The webhook endpoint is public, so without this check anyone who guessed the
 * URL could POST a forged "contact" update and have the bot register accounts
 * on their behalf.
 *
 * The secret is derived from the bot token so there is nothing extra to
 * configure and nothing extra to leak.
 */
export function deriveWebhookSecret(botToken: string): string | null {
  if (!botToken) return null;
  return crypto
    .createHash('sha256')
    .update(`webhook:${botToken}`)
    .digest('hex')
    .slice(0, 64);
}

/** Constant-time comparison of the received header against the expected value. */
export function isValidWebhookSecret(
  botToken: string | undefined,
  received: string | undefined,
): boolean {
  const expected = botToken ? deriveWebhookSecret(botToken) : null;
  // Without a bot token we could not have registered a webhook at all.
  if (!expected) return false;
  if (!received || received.length !== expected.length) return false;

  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}
