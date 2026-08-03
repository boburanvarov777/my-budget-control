import {
  Component,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { formatAmountInput, parseAmount } from '../../utils/format.util';

@Component({
  selector: 'app-currency-input',
  standalone: true,
  template: `
    <input
      type="text"
      inputmode="numeric"
      autocomplete="off"
      class="premium-input"
      [class.premium-input-error]="invalid()"
      [placeholder]="placeholder()"
      [value]="display()"
      (input)="onInput($event)"
      (blur)="onTouched()"
    />
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyInputComponent),
      multi: true,
    },
  ],
})
export class CurrencyInputComponent implements ControlValueAccessor {
  placeholder = input('0');
  invalid = input(false);

  display = signal('');
  private onChange: (value: number | null) => void = () => undefined;
  onTouched: () => void = () => undefined;

  writeValue(value: number | null): void {
    if (value == null || !Number.isFinite(value)) {
      this.display.set('');
      return;
    }
    this.display.set(formatAmountInput(String(value)));
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    void isDisabled;
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cursorFromEnd = input.value.length - (input.selectionStart ?? input.value.length);
    const parsed = parseAmount(input.value);

    if (parsed == null) {
      this.display.set('');
      input.value = '';
      this.onChange(null);
      return;
    }

    const formatted = formatAmountInput(String(parsed));
    this.display.set(formatted);
    input.value = formatted;

    const nextPos = Math.max(0, formatted.length - cursorFromEnd);
    input.setSelectionRange(nextPos, nextPos);
    this.onChange(parsed);
  }
}
