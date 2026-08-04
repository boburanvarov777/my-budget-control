import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  formatDecimalDisplay,
  formatDecimalLive,
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
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .premium-input {
        width: 100%;
      }
    `,
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
    const el = event.target as HTMLInputElement;
    const cursorFromEnd = el.value.length - (el.selectionStart ?? el.value.length);
    const sanitized = sanitizeDecimalInput(el.value, this.maxDecimals());

    if (!sanitized || sanitized === '.') {
      this.display.set(sanitized);
      el.value = sanitized;
      this.onChange(null);
      return;
    }

    const formatted = formatDecimalLive(sanitized, this.formatThousands());
    this.display.set(formatted);
    el.value = formatted;

    const nextPos = Math.max(0, formatted.length - cursorFromEnd);
    el.setSelectionRange(nextPos, nextPos);
    this.onChange(parseDecimal(sanitized, this.maxDecimals()));
  }

  onBlur(): void {
    const parsed = parseDecimal(this.display(), this.maxDecimals());
    if (parsed != null) {
      this.display.set(
        formatDecimalDisplay(parsed, this.maxDecimals(), this.formatThousands()),
      );
    } else {
      this.display.set('');
    }
    this.onChange(parsed);
    this.onTouched();
  }
}
