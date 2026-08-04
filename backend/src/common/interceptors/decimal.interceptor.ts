import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { toNumber } from '../utils/decimal.util';

@Injectable()
export class DecimalInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((data) => this.transform(data)));
  }

  private transform(value: unknown): unknown {
    if (value == null) return value;

    if (value instanceof Decimal) {
      return toNumber(value);
    }

    if (value instanceof Date) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.transform(item));
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (typeof obj.toNumber === 'function') {
        return toNumber(obj as unknown as Decimal);
      }

      const out: Record<string, unknown> = {};
      for (const [key, nested] of Object.entries(obj)) {
        out[key] = this.transform(nested);
      }
      return out;
    }

    return value;
  }
}
