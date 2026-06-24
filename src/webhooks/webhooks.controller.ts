import { Controller, Post, Req, Res } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @SkipThrottle()
  @Post('clerk')
  handleClerkWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    return this.webhooksService.handleClerkWebhook(req, res);
  }
}
