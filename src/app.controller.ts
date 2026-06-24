import { Controller, Get, UseGuards } from '@nestjs/common';

import { AppService } from './app.service';
import { ClerkAuthGuard } from './clerk-auth/clerk-auth.guard';
import { Public } from './public/public.decorator';

@UseGuards(ClerkAuthGuard)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
