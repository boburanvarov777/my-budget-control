interface DecimalLike {
  toNumber?: () => number;
  d?: Array<number | string>;
  s?: number;
}

function asDecimalLike(value: object): DecimalLike {
  return value as DecimalLike;
}

export function coerceAmount(value: unknown): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof value === 'object' && value !== null) {
    const obj = asDecimalLike(value);
    if (typeof obj.toNumber === 'function') {
      const n = obj.toNumber();
      return Number.isFinite(n) ? n : 0;
    }
    if (Array.isArray(obj.d) && obj.d.length) {
      const raw = obj.d.map(String).join('');
      const n = Number(raw);
      const sign = obj.s === -1 ? -1 : 1;
      return Number.isFinite(n) ? n * sign : 0;
    }
  }
  const n = Number(String(value));
  return Number.isFinite(n) ? n : 0;
}

export function formatAmount(amount: number | string | unknown): string {
  const n = coerceAmount(amount);
  return Math.round(n)
    .toLocaleString('uz-UZ')
    .replace(/\u00a0/g, ' ');
}

export function formatMoney(amount: number | string | unknown, currency = "so'm"): string {
  return `${formatAmount(amount)} ${currency}`;
}

export function parseAmount(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const digits = value.replace(/\D/g, '');
  if (!digits) return null;
  return Number(digits);
}

export function formatAmountInput(value: string): string {
  const parsed = parseAmount(value);
  if (parsed == null) return '';
  return formatAmount(parsed);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
}

export function daysUntil(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function currentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}
