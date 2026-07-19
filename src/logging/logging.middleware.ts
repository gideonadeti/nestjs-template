import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId =
      typeof req.id === 'string' || typeof req.id === 'number'
        ? String(req.id)
        : '';
    res.setHeader('x-request-id', requestId);
    next();
  }
}
