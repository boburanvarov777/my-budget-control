import {
  Component,
  forwardRef,
  input,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-note-input',
  standalone: true,
  template: `
    <textarea
      class="premium-textarea"
      [class.premium-input-error]="invalid()"
      [placeholder]="placeholder()"
      [rows]="rows()"
      [value]="value"
      (input)="onInput($event)"
      (blur)="onTouched()"
    ></textarea>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NoteInputComponent),
      multi: true,
    },
  ],
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        min-width: 0;
        max-width: 100%;
      }

      .premium-textarea {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }
    `,
  ],
})
export class NoteInputComponent implements ControlValueAccessor {
  placeholder = input('Ixtiyoriy');
  invalid = input(false);
  rows = input(3);

  value = '';
  private onChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    void isDisabled;
  }

  onInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this.value = el.value;
    this.onChange(this.value);
  }
}
