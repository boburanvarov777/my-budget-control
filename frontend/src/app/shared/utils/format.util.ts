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

/** Faqat raqam va bitta nuqta (tiyin uchun) */
export function sanitizeDecimalInput(raw: string, maxDecimals = 2): string {
  let s = raw.replace(/\s/g, '').replace(',', '.');
  s = s.replace(/[^\d.]/g, '');
  const dotIndex = s.indexOf('.');
  if (dotIndex !== -1) {
    const intPart = s.slice(0, dotIndex);
    let decPart = s.slice(dotIndex + 1).replace(/\./g, '');
    if (decPart.length > maxDecimals) decPart = decPart.slice(0, maxDecimals);
    s = decPart.length ? `${intPart}.${decPart}` : `${intPart}.`;
  }
  return s;
}

export function parseDecimal(value: string | number | null | undefined, maxDecimals = 2): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const s = sanitizeDecimalInput(String(value), maxDecimals);
  if (!s || s === '.') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function formatDecimalDisplay(value: number | string, maxDecimals = 2, formatThousands = true): string {
  const n = typeof value === 'number' ? value : parseDecimal(String(value), maxDecimals);
  if (n == null) return '';

  const fixed = n.toFixed(maxDecimals);
  const trimmed = fixed.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  const [intPart, decPart] = trimmed.split('.');

  if (!formatThousands) {
    return decPart != null ? `${intPart}.${decPart}` : intPart;
  }

  const formattedInt = Number(intPart).toLocaleString('uz-UZ').replace(/\u00a0/g, ' ');
  return decPart != null ? `${formattedInt}.${decPart}` : formattedInt;
}

/** Annuitet bo'yicha yillik foiz stavkasini hisoblash (%) */
export function calcMonthlyPayment(principal: number, monthlyRate: number, months: number): number {
  if (months <= 0) return 0;
  if (monthlyRate <= 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function calcAnnualInterestRate(
  principal: number,
  monthlyPayment: number,
  months: number,
): number {
  if (principal <= 0 || monthlyPayment <= 0 || months <= 0) return 0;

  const zeroRatePayment = principal / months;
  if (monthlyPayment <= zeroRatePayment + 0.001) return 0;

  let lo = 0;
  let hi = 0.5;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const payment = calcMonthlyPayment(principal, mid, months);
    if (payment > monthlyPayment) hi = mid;
    else lo = mid;
  }

  const monthlyRate = (lo + hi) / 2;
  return Math.round(monthlyRate * 12 * 10000) / 100;
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

export function creditPaidMonths(item: {
  totalAmount: unknown;
  remainingDebt: unknown;
  monthlyPayment: unknown;
  months: number;
}): number {
  const total = coerceAmount(item.totalAmount);
  const remaining = coerceAmount(item.remainingDebt);
  const monthly = coerceAmount(item.monthlyPayment);
  if (monthly <= 0 || item.months <= 0) return 0;
  const paid = Math.floor((total - remaining) / monthly);
  return Math.min(item.months, Math.max(0, paid));
}

export function creditRemainingMonths(item: {
  totalAmount: unknown;
  remainingDebt: unknown;
  monthlyPayment: unknown;
  months: number;
}): number {
  return Math.max(0, item.months - creditPaidMonths(item));
}
