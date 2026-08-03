import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
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
  custom: boolean;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, IconComponent],
  template: `
    <section class="premium-page">
      <app-page-header
        title="Kategoriyalar"
        subtitle="Kirim va chiqim kategoriyalarini boshqaring"
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

      <div class="space-y-2">
        @for (c of activeList(); track c.code) {
          <div class="premium-list-item category-item">
            <span>{{ optionLabel(c) }}</span>
            @if (c.custom && c.id) {
              <button type="button" class="icon-btn" (click)="removeCategory(c.id, c.label)">
                <app-icon name="trash-2" [size]="16" />
              </button>
            } @else {
              <span class="premium-small premium-muted">Tizim</span>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .add-card { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
      .add-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
      .space-y-2 > * + * { margin-top: 8px; }
      .category-item { min-height: 52px; }
      .icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: var(--color-muted-2);
        cursor: pointer;
      }
      .icon-btn:hover { color: var(--color-danger); }
    `,
  ],
})
export class CategoriesComponent implements OnInit {
  private api = inject(ApiService);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);

  tab = signal<CategoryTab>('expense');
  incomeCategories = signal<CategoryItem[]>([]);
  expenseCategories = signal<CategoryItem[]>([]);
  newLabel = '';
  adding = signal(false);

  activeList = () =>
    this.tab() === 'income' ? this.incomeCategories() : this.expenseCategories();

  ngOnInit(): void {
    this.loadAll();
  }

  optionLabel(c: CategoryItem): string {
    return c.icon ? `${c.icon} ${c.label}` : c.label;
  }

  loadAll(): void {
    this.api.get<CategoryItem[]>('/categories', { type: 'INCOME' }).subscribe({
      next: (r) => this.incomeCategories.set(r),
    });
    this.api.get<CategoryItem[]>('/categories', { type: 'EXPENSE' }).subscribe({
      next: (r) => this.expenseCategories.set(r),
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
}
