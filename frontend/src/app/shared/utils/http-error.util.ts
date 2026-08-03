import { HttpErrorResponse } from '@angular/common/http';

export function extractApiError(error: unknown, fallback = 'Xatolik yuz berdi'): string {
  if (error instanceof HttpErrorResponse) {
    const msg = error.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
