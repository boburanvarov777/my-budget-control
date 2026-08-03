import { Pipe, PipeTransform } from '@angular/core';
import { formatAmount, formatMoney } from '../utils/format.util';

@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  transform(value: number | null | undefined, currency?: string | null): string {
    if (value == null || !Number.isFinite(value)) {
      return currency === null ? '0' : "0 so'm";
    }
    if (currency === null) return formatAmount(value);
    return formatMoney(value, currency ?? "so'm");
  }
}

@Pipe({ name: 'amount', standalone: true })
export class AmountPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) return '0';
    return formatAmount(value);
  }
}
