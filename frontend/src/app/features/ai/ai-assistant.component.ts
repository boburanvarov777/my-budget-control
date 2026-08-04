import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ApiService } from '../../core/services/api.service';
import { NoteInputComponent } from '../../shared/components/note-input/note-input.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ToastService } from '../../shared/services/toast.service';
import { extractApiError } from '../../shared/utils/http-error.util';

interface AiResponse {
  question: string;
  answer: string;
  tips: string[];
  summary?: {
    income: number;
    expense: number;
    debt: number;
    savings: number;
    remaining: number;
  };
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [FormsModule, IconComponent, NoteInputComponent, PageHeaderComponent],
  template: `
    <section class="premium-page">
      <app-page-header
        title="AI maslahatchi"
        subtitle="Moliyaviy ma'lumotlaringiz asosida shaxsiy tavsiyalar"
      />

      <div class="info-box">
        <p class="info-title">Qanday ishlaydi?</p>
        <p class="premium-small premium-muted">
          Savolingizni yozing — tizim daromad, xarajat, qarz va maqsadlaringizni tahlil qilib,
          amaliy maslahat beradi.
        </p>
      </div>

      <div class="chips">
        @for (q of quickQuestions; track q) {
          <button type="button" class="chip" (click)="useQuestion(q)">{{ q }}</button>
        }
      </div>

      <form class="premium-card form-card" (ngSubmit)="ask()">
        <div class="premium-field">
          <label class="premium-label">Savolingiz</label>
          <app-note-input [(ngModel)]="message" name="message" placeholder="Masalan: Qanday tejashim mumkin?" [rows]="4" />
        </div>
        <button type="submit" class="premium-btn premium-btn-primary premium-btn-block" [disabled]="loading()">
          @if (loading()) {
            <span class="loading-row">
              <span class="premium-spinner sm"></span>
              Tahlil qilinmoqda...
            </span>
          } @else {
            So'rash
          }
        </button>
      </form>

      @if (response(); as r) {
        @if (r.summary) {
          <div class="premium-grid-2 summary-grid">
            <div class="stat-mini">
              <span class="premium-muted">Daromad</span>
              <span class="stat-value text-success">{{ formatStat(r.summary.income) }}</span>
            </div>
            <div class="stat-mini">
              <span class="premium-muted">Xarajat</span>
              <span class="stat-value text-danger">{{ formatStat(r.summary.expense) }}</span>
            </div>
            <div class="stat-mini">
              <span class="premium-muted">Qarz</span>
              <span class="stat-value">{{ formatStat(r.summary.debt) }}</span>
            </div>
            <div class="stat-mini">
              <span class="premium-muted">Qolgan</span>
              <span class="stat-value text-gold">{{ formatStat(r.summary.remaining) }}</span>
            </div>
          </div>
        }

        <div class="space-y-3">
          @for (tip of r.tips; track $index) {
            <div class="premium-card premium-card-accent tip-card">
              <div class="flex items-start gap-3">
                <div class="premium-list-icon active">
                  <app-icon name="sparkles" [size]="18" />
                </div>
                <p class="tip-text">{{ tip }}</p>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .info-box {
        padding: 16px;
        border-radius: 12px;
        border: 1px solid rgba(212, 175, 55, 0.25);
        background: var(--color-gold-soft);
      }

      .info-title {
        margin: 0 0 6px;
        font-size: 14px;
        font-weight: 600;
        color: var(--color-gold);
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 16px 0;
      }

      .chip {
        border: 1px solid var(--color-border);
        border-radius: 999px;
        padding: 8px 14px;
        background: var(--color-card);
        color: var(--color-text);
        font-size: 13px;
        cursor: pointer;
        transition: border-color var(--transition), color var(--transition);
      }

      .chip:hover {
        border-color: var(--color-gold);
        color: var(--color-gold);
      }

      .form-card > * + * { margin-top: 16px; }

      .loading-row {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .premium-spinner.sm {
        width: 18px;
        height: 18px;
        border-width: 2px;
      }

      .summary-grid { margin-top: 16px; }

      .premium-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .stat-mini {
        padding: 14px 16px;
        border-radius: 12px;
        border: 1px solid var(--color-border);
        background: var(--color-card);
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stat-value { font-size: 16px; font-weight: 600; }

      .space-y-3 > * + * { margin-top: 12px; }
      .flex { display: flex; }
      .items-start { align-items: flex-start; }
      .gap-3 { gap: 12px; }

      .tip-text {
        margin: 0;
        font-size: 15px;
        line-height: 1.5;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .text-success { color: var(--color-success); }
      .text-danger { color: var(--color-danger); }
    `,
  ],
})
export class AiAssistantComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  message = '';
  response = signal<AiResponse | null>(null);
  loading = signal(false);

  quickQuestions = [
    'Qanday tejashim mumkin?',
    'Qarzlarim qanday?',
    'Byudjetim to\'g\'rimi?',
    'Maqsadlarimga yetamanmi?',
  ];

  useQuestion(q: string): void {
    this.message = q;
  }

  formatStat(value: number): string {
    return `${Math.round(value).toLocaleString('uz-UZ')} so'm`;
  }

  ask(): void {
    if (!this.message.trim()) {
      this.toast.error('Savol yozing');
      return;
    }

    this.loading.set(true);
    this.api.post<AiResponse>('/ai/ask', { message: this.message.trim() }).subscribe({
      next: (r) => {
        this.response.set(r);
        this.loading.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.loading.set(false);
        this.toast.error(extractApiError(e));
      },
    });
  }
}
