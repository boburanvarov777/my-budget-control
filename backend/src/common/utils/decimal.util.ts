import { Decimal } from '@prisma/client/runtime/library';

export function toNumber(
  value: Decimal | number | string | null | undefined,
): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
