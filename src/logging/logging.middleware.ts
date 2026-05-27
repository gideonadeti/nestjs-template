import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger(LoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, protocol } = req;
    const requestIdHeader = req.header('x-request-id');
    const requestId =
      typeof requestIdHeader === 'string' && requestIdHeader.trim() !== ''
        ? requestIdHeader
        : randomUUID();

    res.setHeader('x-request-id', requestId);
    const startTime = process.hrtime(); // high-resolution timer

    res.on('finish', () => {
      const { statusCode } = res;
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const durationInMs = (seconds * 1e3 + nanoseconds / 1e6).toFixed(2); // milliseconds

      this.logger.log(
        `${protocol.toUpperCase()} ${method} ${originalUrl} ${statusCode} - ${durationInMs}ms (requestId=${requestId})`,
      );
    });

    next();
  }
}
