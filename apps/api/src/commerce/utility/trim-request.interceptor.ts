// @ts-nocheck
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { TRIM_EXCLUDE_KEY } from './trim-exclude.decorator.js';

@Injectable()
export class TrimRequestInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isExcluded = this.reflector.getAllAndOverride<boolean>(
      TRIM_EXCLUDE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isExcluded) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    if (request.body) {
      request.body = this.trimObject(request.body);
    }

    return next.handle();
  }

  private trimObject(obj: any): any {
    if (typeof obj === 'string') {
      return obj.trim();
    }

    if (obj !== null && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        return obj.map((item) => this.trimObject(item));
      }

      const trimmedObj: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        trimmedObj[key] = this.trimObject(value);
      }
      return trimmedObj;
    }

    return obj;
  }
}
// @ts-nocheck
// @ts-nocheck
