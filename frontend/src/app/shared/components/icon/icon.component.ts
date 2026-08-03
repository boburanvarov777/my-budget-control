import { Component, input, computed } from '@angular/core';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  CreditCard,
  User,
  Plus,
  Shield,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ChevronRight,
  Trash2,
  UtensilsCrossed,
  Car,
  Home,
  Baby,
  Coffee,
  Smartphone,
  Gamepad2,
  Gift,
  ShoppingBag,
  Pill,
  CircleDollarSign,
  Bell,
  FileText,
  LogOut,
  Plane,
  Laptop,
  BarChart3,
  Sparkles,
  Calendar,
  LucideIconData,
} from 'lucide-angular';

const ICONS: Record<string, LucideIconData> = {
  'layout-dashboard': LayoutDashboard,
  'arrow-left-right': ArrowLeftRight,
  target: Target,
  'credit-card': CreditCard,
  user: User,
  plus: Plus,
  shield: Shield,
  wallet: Wallet,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'piggy-bank': PiggyBank,
  'chevron-right': ChevronRight,
  'trash-2': Trash2,
  'utensils-crossed': UtensilsCrossed,
  car: Car,
  home: Home,
  baby: Baby,
  coffee: Coffee,
  smartphone: Smartphone,
  'gamepad-2': Gamepad2,
  gift: Gift,
  'shopping-bag': ShoppingBag,
  pill: Pill,
  'circle-dollar-sign': CircleDollarSign,
  bell: Bell,
  'file-text': FileText,
  'log-out': LogOut,
  plane: Plane,
  laptop: Laptop,
  'bar-chart-3': BarChart3,
  sparkles: Sparkles,
  calendar: Calendar,
};

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      [attr.stroke]="color()"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @for (node of nodes(); track $index) {
        @switch (node[0]) {
          @case ('path') {
            <path [attr.d]="attr(node[1], 'd')" />
          }
          @case ('circle') {
            <circle
              [attr.cx]="attr(node[1], 'cx')"
              [attr.cy]="attr(node[1], 'cy')"
              [attr.r]="attr(node[1], 'r')"
            />
          }
          @case ('line') {
            <line
              [attr.x1]="attr(node[1], 'x1')"
              [attr.y1]="attr(node[1], 'y1')"
              [attr.x2]="attr(node[1], 'x2')"
              [attr.y2]="attr(node[1], 'y2')"
            />
          }
          @case ('polyline') {
            <polyline [attr.points]="attr(node[1], 'points')" />
          }
          @case ('rect') {
            <rect
              [attr.x]="attr(node[1], 'x')"
              [attr.y]="attr(node[1], 'y')"
              [attr.width]="attr(node[1], 'width')"
              [attr.height]="attr(node[1], 'height')"
              [attr.rx]="attr(node[1], 'rx')"
            />
          }
        }
      }
    </svg>
  `,
  styles: [`:host { display: inline-flex; line-height: 0; }`],
})
export class IconComponent {
  name = input.required<string>();
  size = input(20);
  strokeWidth = input(1.75);
  color = input('currentColor');

  nodes = computed(() => ICONS[this.name()] ?? CircleDollarSign);

  attr(record: Record<string, string | number>, key: string): string | number | null {
    return record[key] ?? null;
  }
}
