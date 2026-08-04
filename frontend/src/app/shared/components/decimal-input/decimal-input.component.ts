import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  formatDecimalDisplay,
  parseDecimal,
  sanitizeDecimalInput,
} from '../../utils/format.util';

@Component({
  selector: 'app-decimal-input',
  standalone: true,
  template: `
    <input
      type="text"
      inputmode="decimal"
      autocomplete="off"
      class="premium-input"
      [class.premium-input-error]="invalid()"
      [placeholder]="placeholder()"
      [value]="display()"
      (input)="onInput($event)"
      (blur)="onBlur()"
    />
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DecimalInputComponent),
      multi: true,
    },
  ],
})
export class DecimalInputComponent implements ControlValueAccessor {
  placeholder = input('0');
  invalid = input(false);
  maxDecimals = input(2);
  formatThousands = input(true);

  display = signal('');
  private onChange: (value: number | null) => void = () => undefined;
  onTouched: () => void = () => undefined;

  writeValue(value: number | null): void {
    if (value == null || !Number.isFinite(value)) {
      this.display.set('');
      return;
    }
    this.display.set(
      formatDecimalDisplay(value, this.maxDecimals(), this.formatThousands()),
    );
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
    const sanitized = sanitizeDecimalInput(input.value, this.maxDecimals());
    input.value = sanitized;
    this.display.set(sanitized);
    this.onChange(parseDecimal(sanitized, this.maxDecimals()));
  }

  onBlur(): void {
    const parsed = parseDecimal(this.display(), this.maxDecimals());
    if (parsed != null) {
      this.display.set(
        formatDecimalDisplay(parsed, this.maxDecimals(), this.formatThousands()),
      );
    }
    this.onChange(parsed);
    this.onTouched();
  }
}
