export function formatAmount(amount: number): string {
  if (!Number.isFinite(amount)) return '0';
  return Math.round(amount)
    .toLocaleString('uz-UZ')
    .replace(/\u00a0/g, ' ');
}

export function formatMoney(amount: number, currency = "so'm"): string {
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
