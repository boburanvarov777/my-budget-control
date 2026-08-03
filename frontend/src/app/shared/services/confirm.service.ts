import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly visible = signal(false);
  readonly title = signal('');
  readonly message = signal('');

  private resolveFn: ((value: boolean) => void) | null = null;

  ask(title: string, message: string): Promise<boolean> {
    this.title.set(title);
    this.message.set(message);
    this.visible.set(true);
    return new Promise((resolve) => {
      this.resolveFn = resolve;
    });
  }

  confirm(): void {
    this.resolveFn?.(true);
    this.close();
  }

  cancel(): void {
    this.resolveFn?.(false);
    this.close();
  }

  private close(): void {
    this.visible.set(false);
    this.resolveFn = null;
  }
}
