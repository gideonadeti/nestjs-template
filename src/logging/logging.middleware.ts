import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger(LoggingMiddleware.name);

  async use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, protocol } = req;
    const requestIdHeader = req.header('x-request-id');
    const requestId =
      typeof requestIdHeader === 'string' && requestIdHeader.trim() !== ''
        ? requestIdHeader
        : randomUUID();

    res.setHeader('x-request-id', requestId);

    if (process.env['SENTRY_DSN']) {
      try {
        const { getIsolationScope } = (await import('@sentry/nestjs')) as {
          getIsolationScope: () => {
            setTag: (key: string, value: string) => void;
          };
        };
        getIsolationScope().setTag('requestId', requestId);
      } catch {
        // @sentry/nestjs not installed — Sentry integration skipped
      }
    }

    const startTime = process.hrtime();

    res.on('finish', () => {
      const { statusCode } = res;
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const durationInMs = (seconds * 1e3 + nanoseconds / 1e6).toFixed(2);

      this.logger.log(
        `${protocol.toUpperCase()} ${method} ${originalUrl} ${statusCode} - ${durationInMs}ms (requestId=${requestId})`,
      );
    });

    next();
  }
}
