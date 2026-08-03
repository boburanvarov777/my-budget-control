import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="space-y-4">
      <h1 class="text-xl font-semibold">AI Financial Assistant</h1>
      <p class="text-sm text-muted">Savolingizni yozing — moliyaviy tavsiyalar olasiz</p>

      <form class="card space-y-3" (ngSubmit)="ask()">
        <textarea
          class="field min-h-24"
          placeholder="Masalan: Oyligim 25 mln, qanday tejashim mumkin?"
          [(ngModel)]="message"
          name="message"
        ></textarea>
        <button type="submit" class="btn-primary" [disabled]="loading()">
          {{ loading() ? 'Javob kutilmoqda...' : 'So\'rash' }}
        </button>
      </form>

      @if (answer()) {
        <div class="card whitespace-pre-line text-sm leading-relaxed">{{ answer() }}</div>
      }
    </section>
  `,
  styles: [`
    .card { border-radius: 16px; border: 1px solid var(--color-border); background: var(--color-surface-2); padding: 1rem; }
    .field { width: 100%; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); padding: 0.75rem; resize: vertical; }
    .btn-primary { width: 100%; border-radius: 12px; background: var(--color-accent); color: white; padding: 0.75rem; border: none; }
    .text-muted { color: var(--color-muted); }
  `],
})
export class AiAssistantComponent {
  private api = inject(ApiService);
  message = '';
  answer = signal('');
  loading = signal(false);

  ask(): void {
    if (!this.message.trim()) return;
    this.loading.set(true);
    this.api.post<{ answer: string }>('/ai/ask', { message: this.message }).subscribe({
      next: (r) => {
        this.answer.set(r.answer);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
