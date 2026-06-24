import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger(LoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const { method, protocol } = req;
    const urlPath = req.path;
    const requestIdHeader = req.header('x-request-id');
    const requestId =
      typeof requestIdHeader === 'string' && requestIdHeader.trim() !== ''
        ? requestIdHeader
        : randomUUID();

    res.setHeader('x-request-id', requestId);
    const startTime = process.hrtime(); // high-resolution timer
    const userAgent = req.header('user-agent') ?? 'unknown';
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    let hasLogged = false;

    const logRequest = (event: 'finish' | 'close') => {
      if (hasLogged) {
        return;
      }
      hasLogged = true;

      const { statusCode } = res;
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const durationInMs = (seconds * 1e3 + nanoseconds / 1e6).toFixed(2); // milliseconds
      const message =
        `${protocol.toUpperCase()} ${method} ${urlPath} ${statusCode} - ${durationInMs}ms ` +
        `(requestId=${requestId}, ip=${clientIp}, userAgent="${userAgent}", event=${event})`;

      if (statusCode >= 500) {
        this.logger.error(message);
      } else if (statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    };

    res.on('finish', () => logRequest('finish'));
    res.on('close', () => logRequest('close'));

    next();
  }
}
