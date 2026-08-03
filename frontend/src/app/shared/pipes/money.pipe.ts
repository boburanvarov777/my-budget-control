import { Pipe, PipeTransform } from '@angular/core';
import { coerceAmount, formatAmount, formatMoney } from '../utils/format.util';

@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  transform(value: unknown, currency?: string | null): string {
    const amount = coerceAmount(value);
    if (currency === null) return formatAmount(amount);
    return formatMoney(amount, currency ?? "so'm");
  }
}

@Pipe({ name: 'amount', standalone: true })
export class AmountPipe implements PipeTransform {
  transform(value: unknown): string {
    return formatAmount(value);
  }
}
