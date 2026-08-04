import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { ToastService } from '../../shared/services/toast.service';
import { extractApiError } from '../../shared/utils/http-error.util';

type CategoryTab = 'income' | 'expense';

interface CategoryItem {
  id: string | null;
  code: string;
  label: string;
  icon?: string | null;
  custom?: boolean;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, IconComponent],
  template: `
    <section class="premium-page">
      <app-page-header
        title="Kategoriyalar"
        subtitle="O'z kategoriyangizni qo'shing yoki o'chiring"
      />

      <div class="premium-segment">
        <button
          type="button"
          class="premium-segment-btn"
          [class.active]="tab() === 'income'"
          (click)="tab.set('income')"
        >
          Kirim
        </button>
        <button
          type="button"
          class="premium-segment-btn"
          [class.active]="tab() === 'expense'"
          (click)="tab.set('expense')"
        >
          Chiqim
        </button>
      </div>

      @if (returnToTransactions()) {
        <button type="button" class="premium-btn premium-btn-secondary premium-btn-block back-btn" (click)="goBackToTransactions()">
          Kirim-chiqimga qaytish
        </button>
      }

      <div class="premium-card add-card">
        <label class="premium-label">Yangi kategoriya</label>
        <div class="add-row">
          <input
            type="text"
            class="premium-input"
            placeholder="Masalan: Ijara"
            [(ngModel)]="newLabel"
            name="newLabel"
          />
          <button
            type="button"
            class="premium-btn premium-btn-primary"
            [disabled]="adding()"
            (click)="addCategory()"
          >
            Qo'shish
          </button>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Mening kategoriyalarim</h2>
        @if (customList().length) {
          <div class="space-y-2">
            @for (c of customList(); track c.id) {
              <div class="premium-list-item category-item">
                <span>{{ optionLabel(c) }}</span>
                <button type="button" class="delete-btn" (click)="removeCategory(c.id!, c.label)">
                  <app-icon name="trash-2" [size]="16" />
                  O'chirish
                </button>
              </div>
            }
          </div>
        } @else {
          <div class="premium-card premium-muted premium-small empty-hint">
            Hali o'z kategoriyangiz yo'q. Yuqorida nom yozib "Qo'shish" bosing.
          </div>
        }
      </div>

      <div class="section">
        <h2 class="section-title">Tizim kategoriyalari</h2>
        <p class="premium-small premium-muted section-note">
          Standart kategoriyalar o'chirilmaydi
        </p>
        <div class="space-y-2">
          @for (c of systemList(); track c.code) {
            <div class="premium-list-item category-item system">
              <span>{{ optionLabel(c) }}</span>
              <span class="premium-small premium-muted">Tizim</span>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .add-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 20px;
      }

      .add-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px;
      }

      .section {
        margin-bottom: 24px;
      }

      .section-title {
        margin: 0 0 8px;
        font-size: 16px;
        font-weight: 600;
      }

      .section-note {
        margin: 0 0 10px;
      }

      .space-y-2 > * + * {
        margin-top: 8px;
      }

      .category-item {
        min-height: 52px;
      }

      .category-item.system {
        opacity: 0.85;
      }

      .delete-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid rgba(229, 57, 53, 0.35);
        border-radius: 10px;
        background: rgba(229, 57, 53, 0.1);
        color: var(--color-danger);
        font-size: 13px;
        font-weight: 500;
        padding: 8px 12px;
        cursor: pointer;
      }

      .empty-hint {
        padding: 14px 16px;
      }

      .back-btn {
        margin-bottom: 16px;
      }
    `,
  ],
})
export class CategoriesComponent implements OnInit {
  private api = inject(ApiService);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  tab = signal<CategoryTab>('expense');
  returnToTransactions = signal(false);
  incomeCategories = signal<CategoryItem[]>([]);
  expenseCategories = signal<CategoryItem[]>([]);
  newLabel = '';
  adding = signal(false);

  activeList = computed(() =>
    this.tab() === 'income' ? this.incomeCategories() : this.expenseCategories(),
  );

  customList = computed(() => this.activeList().filter((c) => !!c.id));
  systemList = computed(() => this.activeList().filter((c) => !c.id));

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const from = params.get('from');
      const tab = params.get('tab');
      if (from === 'transactions' && (tab === 'income' || tab === 'expense')) {
        this.returnToTransactions.set(true);
        this.tab.set(tab);
      } else {
        this.returnToTransactions.set(false);
      }
    });
    this.loadAll();
  }

  goBackToTransactions(): void {
    this.router.navigate(['/transactions']);
  }

  optionLabel(c: CategoryItem): string {
    return c.icon ? `${c.icon} ${c.label}` : c.label;
  }

  loadAll(): void {
    this.api.get<CategoryItem[]>('/categories', { type: 'INCOME' }).subscribe({
      next: (r) => this.incomeCategories.set(this.normalize(r)),
      error: () => this.toast.error('Kategoriyalar yuklanmadi'),
    });
    this.api.get<CategoryItem[]>('/categories', { type: 'EXPENSE' }).subscribe({
      next: (r) => this.expenseCategories.set(this.normalize(r)),
      error: () => this.toast.error('Kategoriyalar yuklanmadi'),
    });
  }

  addCategory(): void {
    const label = this.newLabel.trim();
    if (!label) {
      this.toast.error('Kategoriya nomini kiriting');
      return;
    }

    const exists = this.activeList().some(
      (c) => c.label.trim().toLowerCase() === label.toLowerCase(),
    );
    if (exists) {
      this.toast.error('Bu nomdagi kategoriya allaqachon mavjud');
      return;
    }

    this.adding.set(true);

    this.api
      .post('/categories', {
        type: this.tab() === 'income' ? 'INCOME' : 'EXPENSE',
        label,
      })
      .subscribe({
        next: () => {
          this.newLabel = '';
          this.adding.set(false);
          this.loadAll();
          this.toast.success("Kategoriya muvaffaqiyatli qo'shildi");
          if (this.returnToTransactions()) {
            this.goBackToTransactions();
          }
        },
        error: (e: HttpErrorResponse) => {
          this.adding.set(false);
          this.toast.error(extractApiError(e));
        },
      });
  }

  async removeCategory(id: string, label: string): Promise<void> {
    const ok = await this.confirm.ask(
      "Kategoriyani o'chirish",
      `"${label}" kategoriyasini rostdan ham o'chirmoqchimisiz?`,
    );
    if (!ok) return;

    this.api.delete(`/categories/${id}`).subscribe({
      next: () => {
        this.loadAll();
        this.toast.success("Kategoriya muvaffaqiyatli o'chirildi");
      },
      error: (e: HttpErrorResponse) => this.toast.error(extractApiError(e)),
    });
  }

  private normalize(items: CategoryItem[]): CategoryItem[] {
    return items.map((c) => ({
      ...c,
      custom: c.custom ?? !!c.id,
    }));
  }
}
