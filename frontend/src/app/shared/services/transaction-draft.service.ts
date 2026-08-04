import { Injectable } from '@angular/core';

export type TransactionTab = 'income' | 'expense';

export interface TransactionFormDraft {
  tab: TransactionTab;
  showForm: boolean;
  editingId?: string | null;
  form: {
    amount: number | null;
    category: string;
    date: string;
    note: string;
  };
}

@Injectable({ providedIn: 'root' })
export class TransactionDraftService {
  private draft: TransactionFormDraft | null = null;

  save(draft: TransactionFormDraft): void {
    this.draft = draft;
  }

  consume(): TransactionFormDraft | null {
    const value = this.draft;
    this.draft = null;
    return value;
  }

  hasDraft(): boolean {
    return this.draft != null;
  }
}
