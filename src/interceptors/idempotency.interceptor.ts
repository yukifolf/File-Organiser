import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, of, throwError } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

interface CachedResponse {
  status: number;
  body: unknown;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const idempotencyKey = request.headers['idempotency-key'] as
      | string
      | undefined;

    if (!idempotencyKey) {
      return next.handle();
    }

    const cacheKey = `idempotency:${idempotencyKey}`;
    const cachedResponse =
      await this.cacheManager.get<CachedResponse>(cacheKey);

    if (cachedResponse) {
      const response = http.getResponse<Response>();
      response.status(cachedResponse.status);
      return of(cachedResponse.body);
    }

    return next.handle().pipe(
      mergeMap(async (body: unknown) => {
        const response = http.getResponse<Response>();
        const responseData: CachedResponse = {
          status: response.statusCode,
          body,
        };
        await this.cacheManager.set(cacheKey, responseData);
        return body;
      }),
      catchError((err: unknown) => {
        return throwError(() => err);
      }),
    );
  }
}
