import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth.component').then((m) => m.AuthComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'income',
        loadComponent: () =>
          import('./features/income/income.component').then(
            (m) => m.IncomeComponent,
          ),
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('./features/expenses/expenses.component').then(
            (m) => m.ExpensesComponent,
          ),
      },
      {
        path: 'credits',
        loadComponent: () =>
          import('./features/credits/credits.component').then(
            (m) => m.CreditsComponent,
          ),
      },
      {
        path: 'micro-loans',
        loadComponent: () =>
          import('./features/micro-loans/micro-loans.component').then(
            (m) => m.MicroLoansComponent,
          ),
      },
      {
        path: 'installments',
        loadComponent: () =>
          import('./features/installments/installments.component').then(
            (m) => m.InstallmentsComponent,
          ),
      },
      {
        path: 'goals',
        loadComponent: () =>
          import('./features/goals/goals.component').then(
            (m) => m.GoalsComponent,
          ),
      },
      {
        path: 'savings',
        loadComponent: () =>
          import('./features/savings/savings.component').then(
            (m) => m.SavingsComponent,
          ),
      },
      {
        path: 'budget',
        loadComponent: () =>
          import('./features/budget/budget.component').then(
            (m) => m.BudgetComponent,
          ),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/calendar.component').then(
            (m) => m.CalendarComponent,
          ),
      },
      {
        path: 'statistics',
        loadComponent: () =>
          import('./features/statistics/statistics.component').then(
            (m) => m.StatisticsComponent,
          ),
      },
      {
        path: 'ai',
        loadComponent: () =>
          import('./features/ai/ai-assistant.component').then(
            (m) => m.AiAssistantComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(
            (m) => m.SettingsComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
